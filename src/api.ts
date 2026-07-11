import { LiveWeather, Message, Phase, PlanItem, UserProfile, WeatherAlert } from './types';

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

export const api = {
  getWeather(location: string) {
    return getJson<{ weather: LiveWeather }>(`/api/weather?location=${encodeURIComponent(location)}`);
  },
  getSummary(location: string, phase: Phase) {
    return postJson<{ summary: string; weather: LiveWeather }>('/api/summary', { location, phase });
  },
  getPlan(profile: UserProfile) {
    return postJson<{ plan: PlanItem[] }>('/api/plan', { profile });
  },
  chat(messages: Pick<Message, 'role' | 'content'>[]) {
    return postJson<{ text: string }>('/api/chat', { messages });
  },
  getAlerts(location: string) {
    return getJson<{ alerts: WeatherAlert[] }>(`/api/alerts?location=${encodeURIComponent(location)}`);
  },
  getTravelAdvisory(destination: string) {
    return postJson<{ advisory: string; weather: LiveWeather }>('/api/travel', { destination });
  },
  reverseGeocode(lat: number, lon: number) {
    return getJson<{ location: string }>(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
  },
};
