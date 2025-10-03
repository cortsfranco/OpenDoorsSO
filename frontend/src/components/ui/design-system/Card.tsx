import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'base' | 'lg';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-card-background border border-card-border shadow-card',
  elevated: 'bg-card-background border border-card-border shadow-lg',
  outlined: 'bg-transparent border-2 border-card-border',
  filled: 'bg-background-secondary border border-card-border'
};

const sizeClasses = {
  sm: 'p-4',
  base: 'p-6',
  lg: 'p-8'
};

export function Card({
  children,
  variant = 'default',
  size = 'base',
  hover = false,
  className,
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg transition-base',
        variantClasses[variant],
        sizeClasses[size],
        {
          'cursor-pointer hover:shadow-md hover:-translate-y-1': hover || onClick,
          'hover:shadow-md': hover
        },
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
}

export function CardTitle({ children, className, size = 'base' }: CardTitleProps) {
  const sizeClasses = {
    sm: 'text-lg font-semibold',
    base: 'text-xl font-semibold',
    lg: 'text-2xl font-semibold'
  };

  return (
    <h3 className={cn(sizeClasses[size], 'text-primary', className)}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border-primary', className)}>
      {children}
    </div>
  );
}

