import { Hono } from 'hono';
import type { Phase, WeatherAlert } from '../../types';
import { generateChatReply, generateText, type ChatTurn } from '../gemini';
import {
  cleanString,
  MAX_CHAT_HISTORY,
  MAX_MESSAGE_LENGTH,
  parseCoord,
  resolveWeather,
  weatherErrorStatus,
  type Env,
} from '../shared';

// Every route here grounds a Gemini call in live weather data fetched
// first — the model explains real numbers, it never invents conditions.
export const assistantRoutes = new Hono<{ Bindings: Env }>();

assistantRoutes.post('/api/summary', async c => {
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
  if ('error' in result) return c.json({ error: result.error }, weatherErrorStatus(result.error));
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

assistantRoutes.get('/api/alerts', async c => {
  const result = await resolveWeather({
    name: cleanString(c.req.query('location')),
    latitude: parseCoord(c.req.query('lat')),
    longitude: parseCoord(c.req.query('lon')),
  });
  if ('error' in result) return c.json({ error: result.error }, weatherErrorStatus(result.error));
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

assistantRoutes.post('/api/chat', async c => {
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

assistantRoutes.post('/api/travel', async c => {
  const body = await c.req.json<{ destination?: string; latitude?: number; longitude?: number }>();

  const result = await resolveWeather({
    name: cleanString(body.destination),
    latitude: parseCoord(body.latitude),
    longitude: parseCoord(body.longitude),
  });
  if ('error' in result) return c.json({ error: result.error }, weatherErrorStatus(result.error));
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
