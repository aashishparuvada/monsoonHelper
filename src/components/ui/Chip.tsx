import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
}

export function Chip({ active = false, label, className = '', ...props }: ChipProps) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors border ${
        active
          ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]'
          : 'bg-transparent text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--text-primary)]'
      } ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}
