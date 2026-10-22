import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, setTheme } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer flex items-center justify-center"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-primary" />
        ) : theme === 'light' ? (
          <Sun className="w-4 h-4 text-warning" />
        ) : (
          <Laptop className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-surface border border-border shadow-lg py-1.5 z-50 animate-scale-in">
          {[
            { key: 'light', label: 'Light', icon: Sun },
            { key: 'dark', label: 'Dark', icon: Moon },
            { key: 'system', label: 'System', icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setTheme(item.key);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-text-muted" />
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
