import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E5E5E7] p-6 shadow-sm transition-all duration-200 ${
        hoverable ? 'hover:border-[#0071E3] hover:shadow-apple-card' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
