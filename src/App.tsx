import React from 'react';
import { useAppContext } from './context/AppContext';
import { ThemeToggle } from './components/ThemeToggle';
import { BottomNav } from './components/BottomNav';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';
import { PreparednessPlan } from './screens/PreparednessPlan';
import { Assistant } from './screens/Assistant';
import { Alerts } from './screens/Alerts';
import { TravelAdvisory } from './screens/TravelAdvisory';
import { Settings } from './screens/Settings';

export default function App() {
  const { currentScreen, onboardingComplete } = useAppContext();

  if (!onboardingComplete && currentScreen === 'onboarding') {
    return <Onboarding />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Home />;
      case 'plan':
        return <PreparednessPlan />;
      case 'assistant':
        return <Assistant />;
      case 'alerts':
        return <Alerts />;
      case 'travel':
        return <TravelAdvisory />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)] z-10">
        <h1 className="font-bold text-lg tracking-tight">Monsoon Ready</h1>
        <ThemeToggle />
      </header>

      <main className="flex-1 overflow-y-auto relative w-full max-w-2xl mx-auto">
        {renderScreen()}
      </main>

      <BottomNav />
    </div>
  );
}
