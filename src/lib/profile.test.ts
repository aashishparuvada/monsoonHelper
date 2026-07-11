// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE, clearProfile, getProfile, saveProfile, toLocationRef } from './profile';

describe('profile storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getProfile()).toBeNull();
  });

  it('round-trips a saved profile', () => {
    const profile = {
      name: 'Ash',
      location: 'Bengaluru, Karnataka, India',
      latitude: 12.97,
      longitude: 77.59,
      context: ['Pets'],
      language: 'English',
    };
    saveProfile(profile);
    expect(getProfile()).toEqual(profile);
  });

  it('clears the stored profile', () => {
    saveProfile(DEFAULT_PROFILE);
    clearProfile();
    expect(getProfile()).toBeNull();
  });

  it('returns null for corrupted JSON instead of throwing', () => {
    localStorage.setItem('userProfile', '{not json');
    expect(getProfile()).toBeNull();
  });
});

describe('toLocationRef', () => {
  it('carries the name and coordinates through', () => {
    const ref = toLocationRef({
      name: 'Ash',
      location: 'Pune',
      latitude: 18.5,
      longitude: 73.8,
      context: [],
      language: '',
    });
    expect(ref).toEqual({ name: 'Pune', latitude: 18.5, longitude: 73.8 });
  });

  it('omits coordinates when the profile never picked a location from the map', () => {
    const ref = toLocationRef({ name: 'Ash', location: 'Pune', context: [], language: '' });
    expect(ref.latitude).toBeUndefined();
    expect(ref.longitude).toBeUndefined();
  });
});
