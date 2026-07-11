import { User, MapPin, Globe, Shield, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Settings() {
  const { theme, setTheme, setOnboardingComplete, navigate } = useAppContext();
  
  const profileStr = localStorage.getItem('userProfile');
  const profile = profileStr ? JSON.parse(profileStr) : { name: 'User', location: 'Mumbai, India', language: 'English' };

  const handleReset = () => {
    localStorage.removeItem('userProfile');
    setOnboardingComplete(false);
    navigate('onboarding');
  };

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Settings</h2>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center gap-4 border-b border-[var(--border)]">
          <div className="w-14 h-14 rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center font-bold text-xl">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{profile.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">Household Profile Active</p>
          </div>
        </div>

        <div className="divide-y divide-[var(--border)]">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="text-[15px] font-medium">Location</span>
            </div>
            <span className="text-sm text-[var(--text-secondary)]">{profile.location}</span>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="text-[15px] font-medium">Language</span>
            </div>
            <span className="text-sm text-[var(--text-secondary)]">{profile.language || 'Auto-detect'}</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-[var(--text-secondary)]" /> : <Sun className="w-5 h-5 text-[var(--text-secondary)]" />}
              <span className="text-[15px] font-medium">Appearance</span>
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg)] p-1 rounded-full border border-[var(--border)]">
              <button 
                onClick={() => setTheme('light')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${theme === 'light' ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'text-[var(--text-secondary)]'}`}
              >
                Light
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${theme === 'dark' ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'text-[var(--text-secondary)]'}`}
              >
                OLED
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[var(--text-secondary)] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[15px] font-medium mb-1">Privacy & Data</h4>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Your profile and context are stored locally on your device. We don't require an account to use Monsoon Ready.
          </p>
        </div>
      </div>

      <button 
        onClick={handleReset}
        className="w-full py-4 text-sm font-medium text-[var(--color-status-red)] bg-[var(--color-status-red)]/10 rounded-2xl hover:bg-[var(--color-status-red)]/20 transition-colors"
      >
        Reset App & Profile
      </button>
    </div>
  );
}
