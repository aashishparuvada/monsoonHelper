import type { LiveWeather, ResolvedLocation, Severity } from '../types';

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

const SEVERE_CODES = new Set([65, 82, 95, 96, 99]);
const CAUTION_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 66, 67, 80, 81]);

function describeWeatherCode(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? 'Unknown conditions';
}

// Thresholds are tuned for monsoon-relevant hazards (heavy rain, gusty wind),
// not general-purpose meteorology.
function deriveSeverity(code: number, precipitationMm: number, windSpeedKmh: number): Severity {
  if (SEVERE_CODES.has(code) || precipitationMm >= 10 || windSpeedKmh >= 60) return 'severe';
  if (CAUTION_CODES.has(code) || precipitationMm >= 2 || windSpeedKmh >= 40) return 'caution';
  return 'safe';
}

// Returns up to `count` candidate places for a typed query, so the frontend
// can offer a Google-Weather-style picker instead of guessing a single
// match and risking a "location not found" dead end.
export async function searchLocations(query: string, count = 6): Promise<ResolvedLocation[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', String(count));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json() as {
    results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country?: string }>;
  };

  return (data.results ?? []).map(r => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

async function geocodeLocation(query: string): Promise<ResolvedLocation | null> {
  const [first] = await searchLocations(query, 1);
  return first ?? null;
}

async function fetchForecast(latitude: number, longitude: number): Promise<Omit<LiveWeather, 'resolvedLocation' | 'severity' | 'condition'> & { weatherCode: number }> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('hourly', 'precipitation_probability');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo forecast request failed with ${res.status}`);

  const data = await res.json() as {
    current: { temperature_2m: number; precipitation: number; weather_code: number; wind_speed_10m: number };
    hourly?: { precipitation_probability?: number[] };
  };

  const upcoming = data.hourly?.precipitation_probability?.slice(0, 6) ?? [];
  const precipitationProbabilityNext6h = upcoming.length ? Math.max(...upcoming) : 0;
  const { temperature_2m, precipitation, weather_code, wind_speed_10m } = data.current;

  return {
    latitude,
    longitude,
    temperatureC: temperature_2m,
    precipitationMm: precipitation,
    windSpeedKmh: wind_speed_10m,
    weatherCode: weather_code,
    precipitationProbabilityNext6h,
  };
}

// Weather for an already-resolved point (e.g. a picker selection) — cannot
// fail with "location not found" since the coordinates are already known good.
export async function getWeatherAt(latitude: number, longitude: number, displayName: string): Promise<LiveWeather> {
  const forecast = await fetchForecast(latitude, longitude);
  return {
    ...forecast,
    resolvedLocation: displayName,
    condition: describeWeatherCode(forecast.weatherCode),
    severity: deriveSeverity(forecast.weatherCode, forecast.precipitationMm, forecast.windSpeedKmh),
  };
}

// Weather for a free-typed name — kept for profiles saved before the
// picker existed. Can return null if the name doesn't geocode.
export async function getLiveWeather(locationQuery: string): Promise<LiveWeather | null> {
  const place = await geocodeLocation(locationQuery);
  if (!place) return null;
  return getWeatherAt(place.latitude, place.longitude, place.name);
}

// Open-Meteo's geocoding API only supports forward search, not reverse
// lookup, so "use my current location" uses BigDataCloud's free,
// keyless reverse-geocoding endpoint instead.
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('localityLanguage', 'en');

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json() as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
  };
  const place = data.city || data.locality;
  if (!place) return null;

  return [place, data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
}

export { deriveSeverity, describeWeatherCode };
