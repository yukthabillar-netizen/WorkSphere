import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98] select-none';

    const variants = {
      primary: 'bg-primary text-primary-fg hover:opacity-90 shadow-sm shadow-primary/20',
      secondary: 'bg-surface-2 hover:bg-surface-3 text-text border border-border/80 shadow-xs',
      outline: 'bg-transparent border border-border hover:bg-surface-2 text-text',
      ghost: 'bg-transparent hover:bg-surface-2 text-text hover:text-text',
      danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/20',
      subtle: 'bg-primary-subtle text-primary hover:bg-primary/20',
    };

    const sizes = {
      xs: 'text-xs px-2 py-1 gap-1 h-7 rounded-sm',
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8 rounded-md',
      md: 'text-sm px-4 py-2 gap-2 h-9 rounded-md',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11 rounded-lg',
      icon: 'p-2 h-9 w-9 rounded-md justify-center',
      iconSm: 'p-1.5 h-7 w-7 rounded-md justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
