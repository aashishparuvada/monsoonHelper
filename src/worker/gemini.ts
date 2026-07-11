import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [500, 1500];

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

export async function generateText(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await withRetry(() => ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  }));
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

  const response = await withRetry(() => ai.models.generateContent({
    model: MODEL,
    config: { systemInstruction },
    contents,
  }));
  return response.text ?? '';
}

// Gemini sometimes wraps JSON output in markdown code fences despite
// instructions not to; strip them before parsing.
export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as T;
}
