import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  isShortcutsOpen: false,
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),

  isQuickTaskOpen: false,
  setQuickTaskOpen: (open) => set({ isQuickTaskOpen: open }),

  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
}));
