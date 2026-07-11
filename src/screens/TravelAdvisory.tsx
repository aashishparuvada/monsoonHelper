import { useState } from 'react';
import type { FormEvent } from 'react';
import { Map, Navigation, Search } from 'lucide-react';
import { api } from '../api';
import { LiveWeather } from '../types';

export function TravelAdvisory() {
  const [destination, setDestination] = useState('');
  const [advisory, setAdvisory] = useState<string | null>(null);
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkSafety = async (e: FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setStatus('loading');
    try {
      const res = await api.getTravelAdvisory(destination);
      setAdvisory(res.advisory);
      setWeather(res.weather);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate advisory.');
      setStatus('error');
    }
  };

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Travel Advisory</h2>
        <p className="text-sm text-[var(--text-secondary)]">Check route safety before you go</p>
      </div>

      <form onSubmit={checkSafety} className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
        </div>
        <input 
          type="text" 
          value={destination}
          onChange={e => setDestination(e.target.value)}
          placeholder="Where are you heading?"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-[var(--color-brand)] transition-colors text-[15px]"
        />
        <button 
          type="submit"
          disabled={!destination.trim() || status === 'loading'}
          className="absolute inset-y-2 right-2 bg-[var(--text-primary)] text-[var(--bg)] px-4 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          Check
        </button>
      </form>

      {status === 'idle' && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--text-secondary)]">
            <Map className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Search a destination</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-[250px]">
            Get real-time, AI-generated safety advice based on current weather conditions.
          </p>
        </div>
      )}

      {status === 'loading' && (
        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--border)]" />
            <div className="w-32 h-5 bg-[var(--border)] rounded" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 bg-[var(--border)] rounded" />
            <div className="w-full h-4 bg-[var(--border)] rounded" />
            <div className="w-2/3 h-4 bg-[var(--border)] rounded" />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-[var(--color-status-red)]/10 border border-[var(--color-status-red)]/20 rounded-2xl text-center text-[var(--color-status-red)]">
          <p className="text-sm font-medium">{errorMessage ?? 'Failed to generate advisory. Please try again.'}</p>
        </div>
      )}

      {status === 'success' && advisory && (
        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center text-[var(--color-brand)]">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Advisory For</p>
              <h3 className="font-semibold text-[15px]">{weather?.resolvedLocation ?? destination}</h3>
            </div>
            {weather && (
              <span className="text-lg font-bold tracking-tighter shrink-0">{Math.round(weather.temperatureC)}°C</span>
            )}
          </div>

          <p className="text-[15px] leading-relaxed">
            {advisory}
          </p>
        </div>
      )}
    </div>
  );
}
