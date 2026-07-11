import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export function Onboarding() {
  const { setOnboardingComplete, navigate } = useAppContext();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [context, setContext] = useState<string[]>([]);
  const [language, setLanguage] = useState('');

  const contextOptions = ['Adults', 'Children', 'Elderly', 'Pets', 'Medical Needs'];

  const toggleContext = (opt: string) => {
    setContext(prev => prev.includes(opt) ? prev.filter(c => c !== opt) : [...prev, opt]);
  };

  const finish = () => {
    // In a real app, save this to context/localStorage
    localStorage.setItem('userProfile', JSON.stringify({ name, location, context, language }));
    setOnboardingComplete(true);
    navigate('home');
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] p-6">
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
          <button onClick={finish} className="text-sm font-medium text-[var(--text-secondary)]">Skip</button>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold mb-4">Welcome to Monsoon Ready</h1>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              Your calm, GenAI-powered assistant for monsoon preparedness and safety. Let's personalize your experience.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">What should we call you?</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  placeholder="Your name"
                />
              </div>
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
              <div>
                <label className="block text-sm font-medium mb-2">City or region</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  placeholder="e.g. Mumbai, Maharashtra"
                />
              </div>
              <button className="w-full py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface)] transition-colors">
                Use my current location
              </button>
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
                <button 
                  key={opt}
                  onClick={() => toggleContext(opt)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    context.includes(opt) 
                      ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]' 
                      : 'border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-primary)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Language</label>
              <input 
                type="text" 
                value={language} 
                onChange={e => setLanguage(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                placeholder="e.g. English, Hindi, Marathi"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6">
        <button 
          onClick={() => step < 3 ? setStep(step + 1) : finish()}
          className="w-full bg-[var(--text-primary)] text-[var(--bg)] py-4 rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
        >
          {step === 3 ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
