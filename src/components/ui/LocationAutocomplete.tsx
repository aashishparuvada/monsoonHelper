import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { MapPin, Search } from 'lucide-react';
import { api } from '../../api';
import { ResolvedLocation } from '../../types';

interface LocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onInputChange: (text: string) => void;
  onSelect: (location: ResolvedLocation) => void;
}

// A typed-and-picked location can never fail to resolve downstream (unlike
// a free-typed city name), so this is the only way locations get set
// wherever "no failure at city name" matters — Onboarding and Travel Advisory.
export function LocationAutocomplete({
  label,
  placeholder,
  value,
  onInputChange,
  onSelect,
}: LocationAutocompleteProps) {
  const [results, setResults] = useState<ResolvedLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchLocations(value.trim());
        if (cancelled) return;
        setResults(res.results);
        setOpen(res.results.length > 0);
        setHighlighted(0);
      } catch {
        if (!cancelled) setResults([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const select = (loc: ResolvedLocation) => {
    onSelect(loc);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      // Consume the Enter here so a parent <form> doesn't also submit —
      // selecting a suggestion, not advancing the form, is the right result.
      e.preventDefault();
      select(results[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
      </div>

      {open && (
        <ul className="absolute z-20 mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg max-h-60 overflow-y-auto">
          {results.map((loc, i) => (
            <li key={`${loc.latitude},${loc.longitude}`}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => select(loc)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm transition-colors ${
                  i === highlighted
                    ? 'bg-[var(--bg)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg)]'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{loc.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
