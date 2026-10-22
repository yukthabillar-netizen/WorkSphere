import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { Modal } from '../ui/Modal';
import { Command } from 'lucide-react';

export const KeyboardShortcutsModal = () => {
  const { isShortcutsOpen, setShortcutsOpen } = useUIStore();

  const shortcutGroups = [
    {
      group: 'Navigation & Overlays',
      shortcuts: [
        { keys: ['⌘ / Ctrl', 'K'], description: 'Open command palette' },
        { keys: ['/'], description: 'Quick search' },
        { keys: ['?'], description: 'Keyboard shortcuts cheat sheet' },
        { keys: ['Esc'], description: 'Close modal, drawer, or dialog' },
      ],
    },
    {
      group: 'Actions',
      shortcuts: [
        { keys: ['C'], description: 'Create new task (quick add)' },
      ],
    },
    {
      group: 'Go To Sequences',
      shortcuts: [
        { keys: ['G', 'then', 'D'], description: 'Go to Dashboard' },
        { keys: ['G', 'then', 'P'], description: 'Go to Projects' },
        { keys: ['G', 'then', 'M'], description: 'Go to My Tasks' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isShortcutsOpen}
      onClose={() => setShortcutsOpen(false)}
      title="Keyboard Shortcuts"
      description="Navigate and manage WorkSphere at speed."
      maxWidth="max-w-md"
    >
      <div className="space-y-5 py-2 text-xs">
        {shortcutGroups.map((group) => (
          <div key={group.group}>
            <h4 className="font-semibold text-text-muted mb-2 tracking-wider uppercase text-[11px]">
              {group.group}
            </h4>
            <div className="space-y-1.5 bg-surface-2/60 rounded-xl p-3 border border-border/60">
              {group.shortcuts.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <span className="text-text">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          k === 'then'
                            ? 'border-transparent text-text-muted text-[10px]'
                            : 'bg-surface border-border text-text shadow-2xs'
                        }`}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
