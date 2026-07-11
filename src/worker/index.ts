import { Hono } from 'hono';
import type { LiveWeather, Phase, PlanItem, UserProfile, WeatherAlert } from '../types';
import { generateChatReply, generateText, parseJsonResponse, type ChatTurn } from './gemini';
import { getLiveWeather, getWeatherAt, reverseGeocode, searchLocations } from './weather';

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

function parseCoord(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

interface LocationInput {
  name?: string;
  latitude?: number;
  longitude?: number;
}

// Resolves weather for either an already-picked point (latitude/longitude —
// from the location picker, cannot fail) or, as a fallback for profiles
// saved before the picker existed, a free-typed name (can fail to geocode).
async function resolveWeather(
  input: LocationInput,
): Promise<{ weather: LiveWeather } | { error: string }> {
  if (input.latitude !== undefined && input.longitude !== undefined) {
    const weather = await getWeatherAt(
      input.latitude,
      input.longitude,
      input.name || 'Selected location',
    );
    return { weather };
  }
  if (input.name) {
    const weather = await getLiveWeather(input.name);
    if (weather) return { weather };
    return { error: `Could not find weather for "${input.name}"` };
  }
  return { error: 'A location is required' };
}

app.get('/api/geocode/search', async c => {
  const query = cleanString(c.req.query('q'));
  if (!query) return c.json({ results: [] });

  const results = await searchLocations(query);
  return c.json({ results });
});

app.get('/api/geocode/reverse', async c => {
  const lat = parseCoord(c.req.query('lat'));
  const lon = parseCoord(c.req.query('lon'));
  if (lat === undefined || lon === undefined) {
    return c.json({ error: 'lat and lon query params are required' }, 400);
  }

  const location = await reverseGeocode(lat, lon);
  if (!location) return c.json({ error: 'Could not resolve that location' }, 404);

  return c.json({ location });
});

app.get('/api/weather', async c => {
  const result = await resolveWeather({
    name: cleanString(c.req.query('location')),
    latitude: parseCoord(c.req.query('lat')),
    longitude: parseCoord(c.req.query('lon')),
  });
  if ('error' in result)
    return c.json({ error: result.error }, result.error.includes('required') ? 400 : 404);
  return c.json({ weather: result.weather });
});

app.post('/api/summary', async c => {
  const body = await c.req.json<{
    location?: string;
    phase?: Phase;
    latitude?: number;
    longitude?: number;
  }>();
  const phase: Phase = body.phase === 'During' || body.phase === 'After' ? body.phase : 'Before';

  const result = await resolveWeather({
    name: cleanString(body.location),
    latitude: parseCoord(body.latitude),
    longitude: parseCoord(body.longitude),
  });
  if ('error' in result)
    return c.json({ error: result.error }, result.error.includes('required') ? 400 : 404);
  const weather = result.weather;

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

app.get('/api/alerts', async c => {
  const result = await resolveWeather({
    name: cleanString(c.req.query('location')),
    latitude: parseCoord(c.req.query('lat')),
    longitude: parseCoord(c.req.query('lon')),
  });
  if ('error' in result)
    return c.json({ error: result.error }, result.error.includes('required') ? 400 : 404);
  const weather = result.weather;

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
        .filter(
          (m): m is ChatTurn =>
            (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
        )
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
  const body = await c.req.json<{ destination?: string; latitude?: number; longitude?: number }>();

  const result = await resolveWeather({
    name: cleanString(body.destination),
    latitude: parseCoord(body.latitude),
    longitude: parseCoord(body.longitude),
  });
  if ('error' in result)
    return c.json({ error: result.error }, result.error.includes('required') ? 400 : 404);
  const weather = result.weather;

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
