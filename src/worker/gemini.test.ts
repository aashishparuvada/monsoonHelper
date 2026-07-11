import { describe, expect, it } from 'vitest';
import { parseJsonResponse } from './gemini';

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
