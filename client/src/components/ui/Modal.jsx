import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog Window */}
      <div
        className={cn(
          'relative w-full rounded-2xl bg-surface border border-border p-6 shadow-xl z-10 animate-scale-in max-h-[90vh] flex flex-col',
          maxWidth,
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
            {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
};
