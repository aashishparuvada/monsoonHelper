import { Home, ListChecks, MessageSquare, Bell, Map, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function BottomNav() {
  const { currentScreen, navigate } = useAppContext();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'plan', icon: ListChecks, label: 'Plan' },
    { id: 'assistant', icon: MessageSquare, label: 'Ask' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'travel', icon: Map, label: 'Travel' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ] as const;

  return (
    <nav className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-2 py-2 pb-safe">
      <ul className="flex items-center justify-around w-full max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <li key={tab.id} className="flex-1">
              <button
                onClick={() => navigate(tab.id)}
                className={`w-full flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-[var(--color-brand)]' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg)]'
                }`}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <tab.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} />
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
