import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-border/80 bg-surface-2/40 my-4',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-3 text-xl shadow-xs">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
