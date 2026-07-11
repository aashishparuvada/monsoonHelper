import React from 'react';

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[var(--border)] rounded-md ${className}`} />
  );
}
