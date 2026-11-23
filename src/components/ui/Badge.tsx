import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'available' | 'partial' | 'missing' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantStyles = {
    available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border border-amber-200',
    missing: 'bg-rose-50 text-rose-700 border border-rose-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    info: 'bg-[#F0F7FF] text-[#0066CC] border border-[#0066CC]/20',
    neutral: 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5E7]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
