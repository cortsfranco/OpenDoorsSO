import React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl'
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold'
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info'
};

const defaultLevels = {
  xs: 6,
  sm: 5,
  base: 4,
  lg: 3,
  xl: 3,
  '2xl': 2,
  '3xl': 2,
  '4xl': 1,
  '5xl': 1
};

export function Heading({
  children,
  level,
  size = 'base',
  weight = 'semibold',
  color = 'primary',
  className,
  as,
  ...props
}: HeadingProps) {
  const Tag = as || (`h${level || defaultLevels[size]}` as keyof JSX.IntrinsicElements);
  
  return (
    <Tag
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        'leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

