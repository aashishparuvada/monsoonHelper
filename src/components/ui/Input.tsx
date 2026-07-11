import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)] tracking-wide">
          {label}
        </label>
      )}
      <input
        className="px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand transition-all"
        {...props}
      />
    </div>
  );
}
