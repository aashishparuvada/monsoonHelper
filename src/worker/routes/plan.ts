import { Hono } from 'hono';
import type { PlanItem, UserProfile } from '../../types';
import { generateText, parseJsonResponse } from '../gemini';
import { cleanString, type Env } from '../shared';

export const planRoutes = new Hono<{ Bindings: Env }>();

planRoutes.post('/api/plan', async c => {
  const body = await c.req.json<{ profile?: Partial<UserProfile> }>();
  const location = cleanString(body.profile?.location) || 'an unspecified location';
  const context = Array.isArray(body.profile?.context)
    ? body.profile!.context.filter((c): c is string => typeof c === 'string').slice(0, 10)
    : [];

  const prompt = `Generate a monsoon preparedness checklist for a household in ${location} with this
context: ${context.length ? context.join(', ') : 'no special needs specified'}. Return EXACTLY a
JSON array of objects with this structure: [{ "id": "short-unique-id", "task": "Task description",
"completed": false, "phase": "Before" | "During" | "After" }]. Include 2-3 concrete, actionable
items per phase (Before, During, After). Do not use markdown code fences, return raw JSON only.`;

  // The JSON checklist itself runs well past the 500-token default reply
  // budget once every phase's tasks are spelled out.
  const raw = await generateText(c.env.GEMINI_API_KEY, prompt, 1200);
  try {
    const plan = parseJsonResponse<PlanItem[]>(raw);
    return c.json({ plan });
  } catch (err) {
    console.error('plan JSON parse failed', { raw, err });
    return c.json({ error: 'Failed to generate a valid plan' }, 502);
  }
});
