import { UserProfile } from '../types';

const STORAGE_KEY = 'userProfile';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Friend',
  location: 'Mumbai, India',
  context: [],
  language: '',
};

export function getProfile(): UserProfile | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}
