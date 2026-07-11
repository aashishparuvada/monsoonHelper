import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Screen = 'onboarding' | 'home' | 'plan' | 'assistant' | 'alerts' | 'travel' | 'settings';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const navigate = (screen: Screen) => setCurrentScreen(screen);

  return (
    <AppContext.Provider value={{ theme, setTheme, currentScreen, navigate, onboardingComplete, setOnboardingComplete }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
