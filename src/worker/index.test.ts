import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as gemini from './gemini';
import type { LiveWeather, PlanItem, ResolvedLocation, WeatherAlert } from '../types';

vi.mock('./gemini', async importOriginal => {
  const actual = await importOriginal<typeof import('./gemini')>();
  return {
    ...actual,
    generateText: vi.fn(),
    generateChatReply: vi.fn(),
  };
});

// Imported after the mock so index.ts picks up the mocked gemini module.
const { default: app } = await import('./index');

const ENV = { GEMINI_API_KEY: 'test-key' };

const GEOCODE_RESULT = {
  results: [
    { latitude: 19.07, longitude: 72.88, name: 'Mumbai', admin1: 'Maharashtra', country: 'India' },
  ],
};

function forecastResponse(
  overrides: Partial<{ weather_code: number; precipitation: number; wind_speed_10m: number }> = {},
) {
  return {
    current: {
      temperature_2m: 28,
      precipitation: overrides.precipitation ?? 0,
      weather_code: overrides.weather_code ?? 0,
      wind_speed_10m: overrides.wind_speed_10m ?? 5,
    },
    hourly: { precipitation_probability: [0, 0, 0, 0, 0, 0] },
  };
}

function mockFetch(handler: (url: string) => object | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const body = handler(input.toString());
      if (body === null) return new Response('not found', { status: 404 });
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
}

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function postJson(path: string, body: unknown) {
  return app.request(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    ENV,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/geocode/search', () => {
  it('returns an empty list for a blank query without hitting the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await app.request('/api/geocode/search?q=', {}, ENV);
    const data = await readJson<{ results: ResolvedLocation[] }>(res);
    expect(data.results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns candidate places for a real query', async () => {
    mockFetch(() => GEOCODE_RESULT);
    const res = await app.request('/api/geocode/search?q=Mumb', {}, ENV);
    const data = await readJson<{ results: ResolvedLocation[] }>(res);
    expect(data.results).toEqual([
      { name: 'Mumbai, Maharashtra, India', latitude: 19.07, longitude: 72.88 },
    ]);
  });
});

describe('GET /api/geocode/reverse', () => {
  it('requires numeric lat/lon', async () => {
    const res = await app.request('/api/geocode/reverse?lat=abc&lon=72.88', {}, ENV);
    expect(res.status).toBe(400);
  });

  it('404s when the coordinates cannot be resolved', async () => {
    mockFetch(() => ({}));
    const res = await app.request('/api/geocode/reverse?lat=0&lon=0', {}, ENV);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/weather', () => {
  it('requires a location', async () => {
    const res = await app.request('/api/weather', {}, ENV);
    expect(res.status).toBe(400);
  });

  it('404s when the name cannot be geocoded', async () => {
    mockFetch(url => (url.includes('geocoding-api') ? { results: [] } : null));
    const res = await app.request('/api/weather?location=Nowhereville', {}, ENV);
    expect(res.status).toBe(404);
  });

  it('returns live weather for a resolvable name', async () => {
    mockFetch(url => (url.includes('geocoding-api') ? GEOCODE_RESULT : forecastResponse()));
    const res = await app.request('/api/weather?location=Mumbai', {}, ENV);
    expect(res.status).toBe(200);
    const data = await readJson<{ weather: LiveWeather }>(res);
    expect(data.weather.resolvedLocation).toContain('Mumbai');
  });

  it('skips the geocoding call entirely when lat/lon are already known', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify(forecastResponse()), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const res = await app.request('/api/weather?location=Somewhere&lat=19.07&lon=72.88', {}, ENV);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/summary', () => {
  it('404s for an unresolvable location', async () => {
    mockFetch(url => (url.includes('geocoding-api') ? { results: [] } : null));
    const res = await postJson('/api/summary', { location: 'Nowhereville', phase: 'Before' });
    expect(res.status).toBe(404);
  });

  it('returns a Gemini summary grounded in the real weather', async () => {
    mockFetch(url => (url.includes('geocoding-api') ? GEOCODE_RESULT : forecastResponse()));
    vi.mocked(gemini.generateText).mockResolvedValue('Stay calm and carry on.');
    const res = await postJson('/api/summary', { location: 'Mumbai', phase: 'Before' });
    expect(res.status).toBe(200);
    const data = await readJson<{ summary: string; weather: LiveWeather }>(res);
    expect(data.summary).toBe('Stay calm and carry on.');
    expect(data.weather.resolvedLocation).toContain('Mumbai');
  });
});

describe('POST /api/plan', () => {
  it('returns the parsed plan on valid JSON', async () => {
    const items = [{ id: '1', task: 'Do X', completed: false, phase: 'Before' }];
    vi.mocked(gemini.generateText).mockResolvedValue(JSON.stringify(items));
    const res = await postJson('/api/plan', { profile: { location: 'Mumbai', context: [] } });
    expect(res.status).toBe(200);
    const data = await readJson<{ plan: PlanItem[] }>(res);
    expect(data.plan).toEqual(items);
  });

  it('502s when Gemini returns unparsable JSON, instead of pretending it worked', async () => {
    vi.mocked(gemini.generateText).mockResolvedValue('not json');
    const res = await postJson('/api/plan', { profile: { location: 'Mumbai', context: [] } });
    expect(res.status).toBe(502);
  });
});

describe('GET /api/alerts', () => {
  it('returns no alerts and never calls Gemini when weather is calm', async () => {
    mockFetch(url =>
      url.includes('geocoding-api')
        ? GEOCODE_RESULT
        : forecastResponse({ weather_code: 0, precipitation: 0, wind_speed_10m: 5 }),
    );
    const res = await app.request('/api/alerts?location=Mumbai', {}, ENV);
    const data = await readJson<{ alerts: WeatherAlert[] }>(res);
    expect(data.alerts).toEqual([]);
    expect(gemini.generateText).not.toHaveBeenCalled();
  });

  it('generates a real alert from Gemini when weather is severe', async () => {
    mockFetch(url =>
      url.includes('geocoding-api') ? GEOCODE_RESULT : forecastResponse({ weather_code: 95 }),
    );
    vi.mocked(gemini.generateText).mockResolvedValue('Severe storm warning.');
    const res = await app.request('/api/alerts?location=Mumbai', {}, ENV);
    const data = await readJson<{ alerts: WeatherAlert[] }>(res);
    expect(data.alerts).toHaveLength(1);
    expect(data.alerts[0].severity).toBe('severe');
    expect(data.alerts[0].summary).toBe('Severe storm warning.');
  });
});

describe('POST /api/chat', () => {
  it('requires at least one message', async () => {
    const res = await postJson('/api/chat', { messages: [] });
    expect(res.status).toBe(400);
  });

  it('returns a real Gemini reply for valid messages', async () => {
    vi.mocked(gemini.generateChatReply).mockResolvedValue('Here is some advice.');
    const res = await postJson('/api/chat', { messages: [{ role: 'user', content: 'Help' }] });
    expect(res.status).toBe(200);
    const data = await readJson<{ text: string }>(res);
    expect(data.text).toBe('Here is some advice.');
  });
});

describe('POST /api/travel', () => {
  it('requires a destination', async () => {
    const res = await postJson('/api/travel', {});
    expect(res.status).toBe(400);
  });

  it('404s for an unresolvable destination', async () => {
    mockFetch(() => null);
    const res = await postJson('/api/travel', { destination: 'Nowhereville' });
    expect(res.status).toBe(404);
  });

  it('returns a Gemini advisory grounded in the real weather', async () => {
    mockFetch(url => (url.includes('geocoding-api') ? GEOCODE_RESULT : forecastResponse()));
    vi.mocked(gemini.generateText).mockResolvedValue('Pack an umbrella.');
    const res = await postJson('/api/travel', { destination: 'Mumbai' });
    expect(res.status).toBe(200);
    const data = await readJson<{ advisory: string }>(res);
    expect(data.advisory).toBe('Pack an umbrella.');
  });
});
