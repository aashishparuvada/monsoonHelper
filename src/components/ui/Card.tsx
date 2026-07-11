import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-[var(--surface)] rounded-[20px] p-4 sm:p-6 border border-[var(--border)] shadow-[var(--shadow-soft)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
