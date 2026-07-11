import { describe, expect, it } from 'vitest';
import { deriveSeverity, describeWeatherCode } from './weather';

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
