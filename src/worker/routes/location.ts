import { Hono } from 'hono';
import { cleanString, parseCoord, resolveWeather, weatherErrorStatus, type Env } from '../shared';
import { reverseGeocode, searchLocations } from '../weather';

// Pure location/weather lookups — no Gemini involved, so these are the
// cheapest and most cacheable routes in the app.
export const locationRoutes = new Hono<{ Bindings: Env }>();

locationRoutes.get('/api/geocode/search', async c => {
  const query = cleanString(c.req.query('q'));
  if (!query) return c.json({ results: [] });

  const results = await searchLocations(query);
  return c.json({ results });
});

locationRoutes.get('/api/geocode/reverse', async c => {
  const lat = parseCoord(c.req.query('lat'));
  const lon = parseCoord(c.req.query('lon'));
  if (lat === undefined || lon === undefined) {
    return c.json({ error: 'lat and lon query params are required' }, 400);
  }

  const location = await reverseGeocode(lat, lon);
  if (!location) return c.json({ error: 'Could not resolve that location' }, 404);

  return c.json({ location });
});

locationRoutes.get('/api/weather', async c => {
  const result = await resolveWeather({
    name: cleanString(c.req.query('location')),
    latitude: parseCoord(c.req.query('lat')),
    longitude: parseCoord(c.req.query('lon')),
  });
  if ('error' in result) return c.json({ error: result.error }, weatherErrorStatus(result.error));
  return c.json({ weather: result.weather });
});
