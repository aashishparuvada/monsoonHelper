import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [500, 1500];

// Short, targeted replies by default (summaries/alerts/advisories/chat are
// all meant to be a paragraph or two); callers that genuinely need more
// (the JSON checklist) pass a higher explicit cap. Bounding this saves
// real latency and cost on every call instead of letting the model run on.
const DEFAULT_MAX_OUTPUT_TOKENS = 500;

function isRetryableStatus(status: unknown): boolean {
  return status === 503 || status === 429;
}

// gemini-2.5-flash intermittently returns 503 UNAVAILABLE under load; a
// short retry with backoff turns a transient blip into a real answer
// instead of surfacing an avoidable error to the user.
async function withRetry<T>(call: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await call();
    } catch (err) {
      lastError = err;
      const status = (err as { status?: unknown })?.status;
      if (!isRetryableStatus(status) || attempt === MAX_RETRIES) throw err;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
  throw lastError;
}

// gemini-2.5-flash's "thinking" tokens are drawn from the same
// maxOutputTokens budget, so a tight cap combined with default thinking
// left the plan endpoint's response truncated mid-JSON (a real bug this
// surfaced). None of these prompts need multi-step reasoning, so thinking
// is disabled outright — faster and cheaper, and removes the truncation risk.
const NO_THINKING = { thinkingBudget: 0 };

export async function generateText(
  apiKey: string,
  prompt: string,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { maxOutputTokens, thinkingConfig: NO_THINKING },
    }),
  );
  return response.text ?? '';
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateChatReply(
  apiKey: string,
  systemInstruction: string,
  messages: ChatTurn[],
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction,
        maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
        thinkingConfig: NO_THINKING,
      },
      contents,
    }),
  );
  return response.text ?? '';
}

// Gemini sometimes wraps JSON output in markdown code fences despite
// instructions not to; strip them before parsing.
export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(cleaned) as T;
}
