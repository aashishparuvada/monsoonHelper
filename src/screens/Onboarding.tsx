import { useState } from 'react';
import type { FormEvent } from 'react';
import { LocateFixed } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import { DEFAULT_PROFILE, saveProfile } from '../lib/profile';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Input } from '../components/ui/Input';
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete';

export function Onboarding() {
  const { setOnboardingComplete, navigate } = useAppContext();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [context, setContext] = useState<string[]>([]);
  const [language, setLanguage] = useState('');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const contextOptions = ['Adults', 'Children', 'Elderly', 'Pets', 'Medical Needs'];

  const toggleContext = (opt: string) => {
    setContext(prev => prev.includes(opt) ? prev.filter(c => c !== opt) : [...prev, opt]);
  };

  const handleLocationInputChange = (text: string) => {
    setLocation(text);
    setCoords(null); // typing invalidates a previously picked point
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported on this device.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { location: resolved } = await api.reverseGeocode(latitude, longitude);
          setLocation(resolved);
          setCoords({ latitude, longitude });
        } catch {
          setLocateError('Could not resolve your location. Please type it in.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocateError('Location access was denied. Please type it in instead.');
        setLocating(false);
      },
    );
  };

  const finish = () => {
    saveProfile({
      name: name.trim() || DEFAULT_PROFILE.name,
      location: location.trim() || DEFAULT_PROFILE.location,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      context,
      language,
    });
    setOnboardingComplete(true);
    navigate('home');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else finish();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] p-6"
    >
      <div className="flex-1 max-w-md mx-auto w-full pt-12">
        <div className="flex justify-between items-center mb-12">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[var(--color-brand)]' : 'w-2 bg-[var(--border)]'}`}
              />
            ))}
          </div>
          <button type="button" onClick={finish} className="text-sm font-medium text-[var(--text-secondary)]">Skip</button>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-4">Welcome to Monsoon Ready</h1>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              Your calm, GenAI-powered assistant for monsoon preparedness and safety. Let's personalize your experience.
            </p>
            <div className="space-y-4">
              <Input
                label="What should we call you?"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-4">Your Location</h1>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              We use your location to provide relevant weather alerts and travel advisories.
            </p>
            <div className="space-y-4">
              <LocationAutocomplete
                label="City or region"
                value={location}
                onInputChange={handleLocationInputChange}
                onSelect={loc => { setLocation(loc.name); setCoords({ latitude: loc.latitude, longitude: loc.longitude }); }}
                placeholder="Start typing a city…"
              />
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="w-full py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LocateFixed className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
                {locating ? 'Locating…' : 'Use my current location'}
              </button>
              {locateError && (
                <p className="text-xs text-[var(--color-status-red)]">{locateError}</p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-4">Household Context</h1>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              This helps us generate a personalized preparedness plan for you.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {contextOptions.map(opt => (
                <Chip
                  key={opt}
                  label={opt}
                  active={context.includes(opt)}
                  onClick={() => toggleContext(opt)}
                />
              ))}
            </div>

            <Input
              label="Preferred Language"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              placeholder="e.g. English, Hindi, Marathi"
            />
          </div>
        )}
      </div>

      <div className="mt-auto pt-6">
        <Button type="submit" fullWidth className="py-4 text-lg">
          {step === 3 ? 'Get Started' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
