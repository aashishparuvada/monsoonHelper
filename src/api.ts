import { LiveWeather, LocationRef, Message, Phase, PlanItem, ResolvedLocation, UserProfile, WeatherAlert } from './types';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error ?? `Request to ${path} failed`);
  }
  return res.json();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const data = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(data?.error ?? `Request to ${path} failed`);
  }
  return res.json();
}

function locationQuery(location: LocationRef): string {
  const params = new URLSearchParams({ location: location.name });
  if (location.latitude !== undefined && location.longitude !== undefined) {
    params.set('lat', String(location.latitude));
    params.set('lon', String(location.longitude));
  }
  return params.toString();
}

export const api = {
  searchLocations(query: string) {
    return getJson<{ results: ResolvedLocation[] }>(`/api/geocode/search?q=${encodeURIComponent(query)}`);
  },
  getWeather(location: LocationRef) {
    return getJson<{ weather: LiveWeather }>(`/api/weather?${locationQuery(location)}`);
  },
  getSummary(location: LocationRef, phase: Phase) {
    return postJson<{ summary: string; weather: LiveWeather }>('/api/summary', {
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      phase,
    });
  },
  getPlan(profile: UserProfile) {
    return postJson<{ plan: PlanItem[] }>('/api/plan', { profile });
  },
  chat(messages: Pick<Message, 'role' | 'content'>[]) {
    return postJson<{ text: string }>('/api/chat', { messages });
  },
  getAlerts(location: LocationRef) {
    return getJson<{ alerts: WeatherAlert[] }>(`/api/alerts?${locationQuery(location)}`);
  },
  getTravelAdvisory(destination: LocationRef) {
    return postJson<{ advisory: string; weather: LiveWeather }>('/api/travel', {
      destination: destination.name,
      latitude: destination.latitude,
      longitude: destination.longitude,
    });
  },
  reverseGeocode(lat: number, lon: number) {
    return getJson<{ location: string }>(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
  },
};
