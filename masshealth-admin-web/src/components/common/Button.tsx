import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-primary-700 border-2 border-primary-300 hover:bg-primary-50',
  };

  // CHANGE: Each size now includes p-2 (8px) as a base padding
  const sizes = {
    sm: 'py-2! px-5! text-sm m-1',    // 8px top/bottom, 20px sides
    md: 'py-2! px-8! text-base m-1',  // 8px top/bottom, 32px sides
    lg: 'py-2! px-10! text-lg m-1',   // 8px top/bottom, 40px sides
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* If you want 8px between the ICON and the TEXT, add gap-2 here */}
      <span className="flex items-center justify-center gap-2">
        {loading ? 'Loading...' : children}
      </span>
    </button>
  );
}