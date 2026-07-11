import { Phase, UserProfile } from './types';

export const api = {
  async getSummary(location: string, phase: Phase) {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, phase })
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  async getPlan(profile: UserProfile) {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  async chat(messages: any[]) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },
  async getTravelAdvisory(destination: string) {
    const res = await fetch('/api/travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination })
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }
};
