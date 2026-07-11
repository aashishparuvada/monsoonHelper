import { Sun, Moon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function ThemeToggle() {
  const { theme, setTheme } = useAppContext();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-[var(--surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-[var(--text-primary)]" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--text-primary)]" />
      )}
    </button>
  );
}
