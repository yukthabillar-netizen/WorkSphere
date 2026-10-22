import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-text-muted flex items-center gap-1">
            {label}
            {props.required && <span className="text-danger">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-danger focus:border-danger focus:ring-danger/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-text-muted flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = React.forwardRef(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-text-muted flex items-center gap-1">
            {label}
            {props.required && <span className="text-danger">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
