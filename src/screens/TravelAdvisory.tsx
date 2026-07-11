import { useState } from 'react';
import type { FormEvent } from 'react';
import { Map, Navigation } from 'lucide-react';
import { api } from '../api';
import { Button } from '../components/ui/Button';
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete';
import { LiveWeather, LocationRef, ResolvedLocation } from '../types';

export function TravelAdvisory() {
  const [destination, setDestination] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [advisory, setAdvisory] = useState<string | null>(null);
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runCheck = async (ref: LocationRef) => {
    setStatus('loading');
    try {
      const res = await api.getTravelAdvisory(ref);
      setAdvisory(res.advisory);
      setWeather(res.weather);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate advisory.');
      setStatus('error');
    }
  };

  const handleInputChange = (text: string) => {
    setDestination(text);
    setCoords(null);
  };

  const handleSelect = (loc: ResolvedLocation) => {
    setDestination(loc.name);
    setCoords({ latitude: loc.latitude, longitude: loc.longitude });
    runCheck({ name: loc.name, latitude: loc.latitude, longitude: loc.longitude });
  };

  const checkSafety = (e: FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    runCheck({ name: destination, latitude: coords?.latitude, longitude: coords?.longitude });
  };

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Travel Advisory</h2>
        <p className="text-sm text-[var(--text-secondary)]">Check route safety before you go</p>
      </div>

      <form onSubmit={checkSafety} className="space-y-3">
        <LocationAutocomplete
          value={destination}
          onInputChange={handleInputChange}
          onSelect={handleSelect}
          placeholder="Where are you heading?"
        />
        <Button
          type="submit"
          fullWidth
          disabled={!destination.trim() || status === 'loading'}
        >
          Check
        </Button>
      </form>

      {status === 'idle' && (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--text-secondary)]">
            <Map className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Search a destination</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-[250px]">
            Pick a place from the list for real-time, AI-generated safety advice based on current weather conditions.
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
