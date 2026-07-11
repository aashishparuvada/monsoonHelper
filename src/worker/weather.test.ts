import { afterEach, describe, expect, it, vi } from 'vitest';
import { deriveSeverity, describeWeatherCode, searchLocations } from './weather';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('describeWeatherCode', () => {
  it('labels known WMO codes', () => {
    expect(describeWeatherCode(0)).toBe('Clear sky');
    expect(describeWeatherCode(95)).toBe('Thunderstorm');
  });

  it('falls back gracefully for unknown codes', () => {
    expect(describeWeatherCode(9999)).toBe('Unknown conditions');
  });
});

describe('deriveSeverity', () => {
  it('is severe for a thunderstorm code regardless of other readings', () => {
    expect(deriveSeverity(95, 0, 0)).toBe('severe');
  });

  it('is severe when heavy precipitation is measured even under a clear code', () => {
    expect(deriveSeverity(0, 15, 0)).toBe('severe');
  });

  it('is severe when wind speed crosses the gale threshold', () => {
    expect(deriveSeverity(0, 0, 70)).toBe('severe');
  });

  it('is caution for a moderate rain code with light readings', () => {
    expect(deriveSeverity(61, 0, 0)).toBe('caution');
  });

  it('is caution for moderate precipitation under a clear code', () => {
    expect(deriveSeverity(0, 3, 0)).toBe('caution');
  });

  it('is safe when nothing crosses a threshold', () => {
    expect(deriveSeverity(0, 0, 0)).toBe('safe');
  });
});

describe('searchLocations', () => {
  // Regression test: Open-Meteo's geocoding search returns zero results for
  // a "City, State, Country" compound string (confirmed live against the
  // real API) — exactly the display format this same function, and the
  // BigDataCloud reverse-geocode, build and save into a profile's
  // `location`. A profile saved before lat/lon were captured would then
  // fail every weather lookup on a perfectly valid, previously-resolved city.
  it('queries Open-Meteo with only the first comma segment', async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL) =>
        new Response(
          JSON.stringify({
            results: [
              {
                name: 'Visakhapatnam',
                admin1: 'Andhra Pradesh',
                country: 'India',
                latitude: 17.68,
                longitude: 83.2,
              },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await searchLocations('Visakhapatnam, Andhra Pradesh, India');

    const requestedUrl = new URL(fetchMock.mock.calls[0][0].toString());
    expect(requestedUrl.searchParams.get('name')).toBe('Visakhapatnam');
  });
});
