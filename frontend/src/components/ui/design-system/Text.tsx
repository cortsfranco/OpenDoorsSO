import React from 'react';
import { cn } from '@/lib/utils';

interface TextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | 'disabled';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  truncate?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  disabled: 'text-disabled'
};

export function Text({
  children,
  size = 'base',
  weight = 'normal',
  color = 'primary',
  className,
  as = 'p',
  truncate = false,
  italic = false,
  underline = false,
  ...props
}: TextProps) {
  return (
    <as
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        {
          'truncate': truncate,
          'italic': italic,
          'underline': underline
        },
        className
      )}
      {...props}
    >
      {children}
    </as>
  );
}

