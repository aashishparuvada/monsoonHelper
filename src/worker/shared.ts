import type { LiveWeather } from '../types';
import { getLiveWeather, getWeatherAt } from './weather';

export interface Env {
  GEMINI_API_KEY: string;
}

export const MAX_INPUT_LENGTH = 120;
export const MAX_CHAT_HISTORY = 20;
export const MAX_MESSAGE_LENGTH = 2000;

export function cleanString(value: unknown, maxLength = MAX_INPUT_LENGTH): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function parseCoord(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export interface LocationInput {
  name?: string;
  latitude?: number;
  longitude?: number;
}

// Resolves weather for either an already-picked point (latitude/longitude —
// from the location picker, cannot fail) or, as a fallback for profiles
// saved before the picker existed, a free-typed name (can fail to geocode).
export async function resolveWeather(
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

export function weatherErrorStatus(error: string): 400 | 404 {
  return error.includes('required') ? 400 : 404;
}
