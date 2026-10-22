import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isShortcutsOpen,
    setShortcutsOpen,
    isQuickTaskOpen,
    setQuickTaskOpen,
  } = useUIStore();

  const gKeyTimerRef = useRef(null);
  const waitingForSecondKeyRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in input, textarea, or contentEditable
      const targetTag = e.target.tagName?.toLowerCase();
      const isInput =
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        e.target.isContentEditable;

      // Cmd/Ctrl + K (always works)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      // Escape key (close modals/drawers)
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setCommandPaletteOpen(false);
        if (isShortcutsOpen) setShortcutsOpen(false);
        if (isQuickTaskOpen) setQuickTaskOpen(false);
        return;
      }

      // If user is actively typing in a form input, skip single letter shortcuts
      if (isInput) return;

      // '?' -> shortcuts help dialog
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // 'C' -> new task dialog
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setQuickTaskOpen(true);
        return;
      }

      // '/' -> focus search or open command palette
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Two-key chord sequences: 'G' then 'D', 'P', or 'M'
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
        waitingForSecondKeyRef.current = true;
        clearTimeout(gKeyTimerRef.current);
        gKeyTimerRef.current = setTimeout(() => {
          waitingForSecondKeyRef.current = false;
        }, 1200);
        return;
      }

      if (waitingForSecondKeyRef.current) {
        waitingForSecondKeyRef.current = false;
        clearTimeout(gKeyTimerRef.current);
        const secondKey = e.key.toLowerCase();
        if (secondKey === 'd') {
          e.preventDefault();
          navigate('/dashboard');
        } else if (secondKey === 'p') {
          e.preventDefault();
          navigate('/projects');
        } else if (secondKey === 'm') {
          e.preventDefault();
          navigate('/my-tasks');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gKeyTimerRef.current);
    };
  }, [
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isShortcutsOpen,
    setShortcutsOpen,
    isQuickTaskOpen,
    setQuickTaskOpen,
    navigate,
  ]);
}
