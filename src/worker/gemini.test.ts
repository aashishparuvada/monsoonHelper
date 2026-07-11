import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const generateContentMock = vi.fn();
vi.mock('@google/genai', () => ({
  // A regular function (not an arrow function) so `new GoogleGenAI(...)`
  // works — arrow functions can't be constructors.
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    return { models: { generateContent: generateContentMock } };
  }),
}));

const { generateChatReply, generateText, parseJsonResponse } = await import('./gemini');

function quotaError() {
  return Object.assign(new Error('quota exceeded'), { status: 429 });
}

beforeEach(() => {
  generateContentMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('parseJsonResponse', () => {
  it('parses raw JSON', () => {
    expect(parseJsonResponse<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n[{"id":"1","task":"Test","completed":false,"phase":"Before"}]\n```';
    expect(parseJsonResponse(wrapped)).toEqual([
      { id: '1', task: 'Test', completed: false, phase: 'Before' },
    ]);
  });

  it('throws on genuinely invalid JSON instead of silently returning empty data', () => {
    expect(() => parseJsonResponse('not json')).toThrow();
  });
});

describe('generateText', () => {
  it('returns real Gemini output', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'a real answer' });
    const result = await generateText('key', 'prompt A ' + Math.random());
    expect(result).toBe('a real answer');
  });

  // Free-tier quota is per-model, so a quota-exhausted primary should still
  // get a real answer from a different model's separate quota bucket —
  // never a fabricated one.
  it('falls back to gemini-2.5-flash-lite when the primary model is quota-exhausted', async () => {
    vi.useFakeTimers();
    generateContentMock
      .mockRejectedValueOnce(quotaError())
      .mockRejectedValueOnce(quotaError())
      .mockRejectedValueOnce(quotaError())
      .mockResolvedValueOnce({ text: 'answer from the fallback model' });

    const promise = generateText('key', 'prompt B ' + Math.random());
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('answer from the fallback model');
    expect(generateContentMock).toHaveBeenCalledTimes(4);
    expect(generateContentMock.mock.calls[0][0].model).toBe('gemini-2.5-flash');
    expect(generateContentMock.mock.calls[3][0].model).toBe('gemini-2.5-flash-lite');
  });

  it('propagates a genuinely non-retryable error instead of masking it', async () => {
    generateContentMock.mockRejectedValueOnce(
      Object.assign(new Error('bad request'), { status: 400 }),
    );
    await expect(generateText('key', 'prompt C ' + Math.random())).rejects.toThrow('bad request');
  });

  it('reuses a real prior response for an identical prompt instead of calling Gemini again', async () => {
    const prompt = 'prompt D ' + Math.random();
    generateContentMock.mockResolvedValueOnce({ text: 'cached answer' });

    const first = await generateText('key', prompt);
    const second = await generateText('key', prompt);

    expect(first).toBe('cached answer');
    expect(second).toBe('cached answer');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });
});

describe('generateChatReply', () => {
  it('returns real Gemini output for a chat turn', async () => {
    generateContentMock.mockResolvedValueOnce({ text: 'chat answer' });
    const result = await generateChatReply('key', 'system', [
      { role: 'user', content: 'hi ' + Math.random() },
    ]);
    expect(result).toBe('chat answer');
  });
});
