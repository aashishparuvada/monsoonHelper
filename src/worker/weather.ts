import type { Severity } from '../types';

export interface LiveWeather {
  resolvedLocation: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  precipitationMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  condition: string;
  severity: Severity;
  precipitationProbabilityNext6h: number;
}

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

interface GeocodeResult {
  latitude: number;
  longitude: number;
  resolvedName: string;
}

async function geocodeLocation(query: string): Promise<GeocodeResult | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json() as {
    results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country?: string }>;
  };
  const first = data.results?.[0];
  if (!first) return null;

  const resolvedName = [first.name, first.admin1, first.country].filter(Boolean).join(', ');
  return { latitude: first.latitude, longitude: first.longitude, resolvedName };
}

export async function getLiveWeather(locationQuery: string): Promise<LiveWeather | null> {
  const place = await geocodeLocation(locationQuery);
  if (!place) return null;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(place.latitude));
  url.searchParams.set('longitude', String(place.longitude));
  url.searchParams.set('current', 'temperature_2m,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('hourly', 'precipitation_probability');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json() as {
    current: { temperature_2m: number; precipitation: number; weather_code: number; wind_speed_10m: number };
    hourly?: { precipitation_probability?: number[] };
  };

  const upcoming = data.hourly?.precipitation_probability?.slice(0, 6) ?? [];
  const precipitationProbabilityNext6h = upcoming.length ? Math.max(...upcoming) : 0;
  const { temperature_2m, precipitation, weather_code, wind_speed_10m } = data.current;

  return {
    resolvedLocation: place.resolvedName,
    latitude: place.latitude,
    longitude: place.longitude,
    temperatureC: temperature_2m,
    precipitationMm: precipitation,
    windSpeedKmh: wind_speed_10m,
    weatherCode: weather_code,
    condition: describeWeatherCode(weather_code),
    severity: deriveSeverity(weather_code, precipitation, wind_speed_10m),
    precipitationProbabilityNext6h,
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = await res.json() as {
    results?: Array<{ name: string; admin1?: string; country?: string }>;
  };
  const first = data.results?.[0];
  if (!first) return null;

  return [first.name, first.admin1, first.country].filter(Boolean).join(', ');
}

export { deriveSeverity, describeWeatherCode };
