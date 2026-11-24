'use client';

import React from 'react';
import { haptics } from '@/lib/haptics';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  isLoading = false,
  fullWidth = false,
  icon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] touch-manipulation max-w-full text-center leading-normal';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[42px] gap-2',
    lg: 'text-base px-6 py-2.5 min-h-[48px] gap-2.5',
  };

  const roundedStyle = pill ? 'rounded-full' : 'rounded-xl';

  const variantStyles = {
    primary:
      'bg-[#0066CC] hover:bg-[#0055b3] text-white active:bg-[#004494] shadow-sm',
    secondary:
      'bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5E7] active:bg-[#E5E5E7] shadow-xs',
    ghost:
      'bg-transparent hover:bg-[#F5F5F7] text-[#1D1D1F] active:bg-[#E5E5E7]',
    danger:
      'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 active:bg-rose-100 shadow-xs',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white active:bg-emerald-800 shadow-sm',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading) {
      haptics.buttonPress(variant);
    }
    onClick?.(e);
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${roundedStyle} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children && (
        <span className="truncate-safe break-words max-w-full">
          {children}
        </span>
      )}
    </button>
  );
};
