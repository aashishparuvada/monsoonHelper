import { Hono } from 'hono';
import type { Phase, PlanItem, UserProfile, WeatherAlert } from '../types';
import { generateChatReply, generateText, parseJsonResponse, type ChatTurn } from './gemini';
import { getLiveWeather, reverseGeocode } from './weather';

interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

const MAX_INPUT_LENGTH = 120;
const MAX_CHAT_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 2000;

function cleanString(value: unknown, maxLength = MAX_INPUT_LENGTH): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

app.get('/api/weather', async c => {
  const location = cleanString(c.req.query('location'));
  if (!location) return c.json({ error: 'A location is required' }, 400);

  const weather = await getLiveWeather(location);
  if (!weather) return c.json({ error: `Could not find weather for "${location}"` }, 404);

  return c.json({ weather });
});

app.get('/api/geocode/reverse', async c => {
  const lat = Number(c.req.query('lat'));
  const lon = Number(c.req.query('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return c.json({ error: 'lat and lon query params are required' }, 400);
  }

  const location = await reverseGeocode(lat, lon);
  if (!location) return c.json({ error: 'Could not resolve that location' }, 404);

  return c.json({ location });
});

app.post('/api/summary', async c => {
  const body = await c.req.json<{ location?: string; phase?: Phase }>();
  const location = cleanString(body.location);
  const phase: Phase = body.phase === 'During' || body.phase === 'After' ? body.phase : 'Before';
  if (!location) return c.json({ error: 'A location is required' }, 400);

  const weather = await getLiveWeather(location);
  if (!weather) return c.json({ error: `Could not find weather for "${location}"` }, 404);

  const prompt = `You are Monsoon Ready, a calm and reassuring monsoon preparedness assistant.
Live weather for ${weather.resolvedLocation}: ${weather.condition}, ${weather.temperatureC}°C,
${weather.precipitationMm}mm precipitation in the last hour, wind ${weather.windSpeedKmh} km/h,
${weather.precipitationProbabilityNext6h}% chance of rain in the next 6 hours.
The user is currently in the "${phase}" phase of a monsoon event (Before/During/After).
Write one short, plain-language paragraph explaining what this weather means for them right
now and what phase-appropriate action (if any) they should consider. Be concise and reassuring,
not alarmist.`;

  const summary = await generateText(c.env.GEMINI_API_KEY, prompt);
  return c.json({ summary, weather });
});

app.post('/api/plan', async c => {
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

  const raw = await generateText(c.env.GEMINI_API_KEY, prompt);
  try {
    const plan = parseJsonResponse<PlanItem[]>(raw);
    return c.json({ plan });
  } catch {
    return c.json({ error: 'Failed to generate a valid plan' }, 502);
  }
});

app.get('/api/alerts', async c => {
  const location = cleanString(c.req.query('location'));
  if (!location) return c.json({ error: 'A location is required' }, 400);

  const weather = await getLiveWeather(location);
  if (!weather) return c.json({ error: `Could not find weather for "${location}"` }, 404);

  if (weather.severity === 'safe') {
    return c.json({ alerts: [] as WeatherAlert[] });
  }

  const prompt = `Live weather for ${weather.resolvedLocation}: ${weather.condition},
${weather.precipitationMm}mm precipitation in the last hour, wind ${weather.windSpeedKmh} km/h,
${weather.precipitationProbabilityNext6h}% chance of rain in the next 6 hours. This has been
classified as "${weather.severity}" severity. Write one short, specific, plain-language alert
sentence (max 30 words) describing the hazard and one safety recommendation. Do not invent
specifics (like exact flooded streets) that aren't in the data given.`;

  const summary = await generateText(c.env.GEMINI_API_KEY, prompt);
  const alert: WeatherAlert = {
    id: `${weather.latitude},${weather.longitude}-${weather.weatherCode}`,
    severity: weather.severity,
    timestamp: new Date().toISOString(),
    summary,
    area: weather.resolvedLocation,
  };

  return c.json({ alerts: [alert] });
});

app.post('/api/chat', async c => {
  const body = await c.req.json<{ messages?: ChatTurn[] }>();
  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter((m): m is ChatTurn => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-MAX_CHAT_HISTORY)
        .map(m => ({ ...m, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))
    : [];

  if (messages.length === 0) return c.json({ error: 'At least one message is required' }, 400);

  const systemInstruction = `You are Monsoon Ready, a calm, reassuring monsoon preparedness and
safety assistant. Detect the language the user is writing in and reply fluently in that same
language, regardless of which language earlier messages used. Keep answers concise, practical,
and focused on weather safety, emergency preparedness, and local advisories.`;

  const text = await generateChatReply(c.env.GEMINI_API_KEY, systemInstruction, messages);
  return c.json({ text });
});

app.post('/api/travel', async c => {
  const body = await c.req.json<{ destination?: string }>();
  const destination = cleanString(body.destination);
  if (!destination) return c.json({ error: 'A destination is required' }, 400);

  const weather = await getLiveWeather(destination);
  if (!weather) return c.json({ error: `Could not find "${destination}"` }, 404);

  const prompt = `Live weather for ${weather.resolvedLocation}: ${weather.condition},
${weather.temperatureC}°C, ${weather.precipitationMm}mm precipitation in the last hour, wind
${weather.windSpeedKmh} km/h, ${weather.precipitationProbabilityNext6h}% chance of rain in the
next 6 hours. Write a brief, realistic monsoon-season travel advisory for someone heading to
${weather.resolvedLocation} based on these actual conditions. Mention concrete precautions only
if the conditions warrant them.`;

  const advisory = await generateText(c.env.GEMINI_API_KEY, prompt);
  return c.json({ advisory, weather });
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Something went wrong. Please try again.' }, 500);
});

export default app;
