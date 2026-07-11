import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';

export async function generateText(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
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

  const response = await ai.models.generateContent({
    model: MODEL,
    config: { systemInstruction },
    contents,
  });
  return response.text ?? '';
}

// Gemini sometimes wraps JSON output in markdown code fences despite
// instructions not to; strip them before parsing.
export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned) as T;
}
