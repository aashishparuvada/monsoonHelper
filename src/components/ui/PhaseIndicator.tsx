import React from 'react';

interface PhaseIndicatorProps {
  phase: 'Before' | 'During' | 'After';
  onChange?: (phase: 'Before' | 'During' | 'After') => void;
}

export function PhaseIndicator({ phase, onChange }: PhaseIndicatorProps) {
  const phases: ('Before' | 'During' | 'After')[] = ['Before', 'During', 'After'];

  return (
    <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-full p-1 w-full max-w-sm mx-auto mb-6">
      {phases.map((p) => {
        const isActive = p === phase;
        let activeColor = 'bg-[var(--text-primary)] text-[var(--bg)]';
        
        // Contextual recoloring for 'During'
        if (isActive && p === 'During') {
          activeColor = 'bg-status-amber text-[#000]'; 
        }

        return (
          <button
            key={p}
            onClick={() => onChange?.(p)}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-medium tracking-wide rounded-full transition-all duration-200 ${
              isActive ? activeColor : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
