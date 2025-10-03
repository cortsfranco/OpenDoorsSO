import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'base' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const sizeClasses = {
  sm: {
    value: 'text-lg font-semibold',
    label: 'text-xs',
    icon: 'h-4 w-4'
  },
  base: {
    value: 'text-2xl font-semibold',
    label: 'text-sm',
    icon: 'h-5 w-5'
  },
  lg: {
    value: 'text-3xl font-semibold',
    label: 'text-base',
    icon: 'h-6 w-6'
  }
};

const colorClasses = {
  primary: {
    value: 'text-primary',
    label: 'text-secondary',
    trend: 'text-primary'
  },
  success: {
    value: 'text-success',
    label: 'text-secondary',
    trend: 'text-success'
  },
  warning: {
    value: 'text-warning',
    label: 'text-secondary',
    trend: 'text-warning'
  },
  error: {
    value: 'text-error',
    label: 'text-secondary',
    trend: 'text-error'
  },
  info: {
    value: 'text-info',
    label: 'text-secondary',
    trend: 'text-info'
  }
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus
};

export function Metric({
  value,
  label,
  trend,
  trendValue,
  icon,
  size = 'base',
  color = 'primary',
  className
}: MetricProps) {
  const TrendIcon = trend ? trendIcons[trend] : null;
  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className={cn(sizes.value, colors.value)}>
          {value}
        </span>
        {icon && (
          <div className={cn(sizes.icon, colors.value)}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <span className={cn(sizes.label, colors.label)}>
          {label}
        </span>
        
        {trend && trendValue && (
          <div className={cn('flex items-center space-x-1', sizes.label, colors.trend)}>
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

