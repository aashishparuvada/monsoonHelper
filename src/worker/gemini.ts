import { GoogleGenAI } from '@google/genai';
import type { GenerateContentParameters } from '@google/genai';

const PRIMARY_MODEL = 'gemini-2.5-flash';
// Free-tier Gemini quotas are per-model, not per-key — so when the primary
// model's daily quota is exhausted, gemini-2.5-flash-lite has its own
// separate bucket. This is still a real, live Gemini call on a different
// model, never a fabricated response.
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';
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

// Repeat calls for the same prompt happen constantly in practice — the same
// city's weather is edge-cached for 5 minutes (see weather.ts), so
// re-summarizing it within that window produces a byte-identical prompt.
// Reusing that real, already-generated response avoids spending free-tier
// quota re-answering a question Gemini has already genuinely answered.
// This is never a substitute for a live call; it's a hit only on an exact,
// prior real response, and it expires quickly.
const RESPONSE_CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, { text: string; expiresAt: number }>();

function getCachedResponse(key: string): string | undefined {
  const hit = responseCache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    responseCache.delete(key);
    return undefined;
  }
  return hit.text;
}

function setCachedResponse(key: string, text: string): void {
  responseCache.set(key, { text, expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS });
}

// gemini-2.5-flash's "thinking" tokens are drawn from the same
// maxOutputTokens budget, so a tight cap combined with default thinking
// left the plan endpoint's response truncated mid-JSON (a real bug this
// surfaced). None of these prompts need multi-step reasoning, so thinking
// is disabled outright — faster and cheaper, and removes the truncation risk.
const NO_THINKING = { thinkingBudget: 0 };

async function generateWithFallback(
  apiKey: string,
  buildRequest: (model: string) => GenerateContentParameters,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await withRetry(() => ai.models.generateContent(buildRequest(PRIMARY_MODEL)));
    return response.text ?? '';
  } catch (err) {
    const status = (err as { status?: unknown })?.status;
    if (!isRetryableStatus(status)) throw err;
    const response = await withRetry(() => ai.models.generateContent(buildRequest(FALLBACK_MODEL)));
    return response.text ?? '';
  }
}

export async function generateText(
  apiKey: string,
  prompt: string,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
): Promise<string> {
  const cacheKey = JSON.stringify({ kind: 'text', prompt, maxOutputTokens });
  const cached = getCachedResponse(cacheKey);
  if (cached !== undefined) return cached;

  const text = await generateWithFallback(apiKey, model => ({
    model,
    contents: prompt,
    config: { maxOutputTokens, thinkingConfig: NO_THINKING },
  }));
  setCachedResponse(cacheKey, text);
  return text;
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
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  const cacheKey = JSON.stringify({ kind: 'chat', systemInstruction, messages });
  const cached = getCachedResponse(cacheKey);
  if (cached !== undefined) return cached;

  const text = await generateWithFallback(apiKey, model => ({
    model,
    config: {
      systemInstruction,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
      thinkingConfig: NO_THINKING,
    },
    contents,
  }));
  setCachedResponse(cacheKey, text);
  return text;
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
