import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export const Drawer = ({ isOpen, onClose, title, headerActions, children, className }) => {
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={cn(
          'relative w-full sm:w-[560px] h-full bg-surface border-l border-border shadow-2xl z-10 flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          className
        )}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-border bg-surface/95 backdrop-blur-sm">
          <div className="flex-1 mr-4 overflow-hidden">{title}</div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
