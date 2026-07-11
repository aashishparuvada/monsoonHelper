import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', fullWidth, className = '', type = 'button', children, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  const sizeClasses = "px-4 py-3 text-sm";
  const widthClasses = fullWidth ? "w-full" : "";
  
  const variantClasses = {
    primary: "bg-brand text-white hover:opacity-90 border border-brand",
    secondary: "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg)]",
    outline: "border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-brand hover:text-brand",
    ghost: "text-[var(--text-primary)] hover:bg-[var(--surface)]"
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses} ${widthClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
