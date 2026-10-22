import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: window.localStorage.getItem('worksphere_token') || null,
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: true,
  theme: window.localStorage.getItem('worksphere_theme') || 'system',

  initAuth: async () => {
    const token = window.localStorage.getItem('worksphere_token');
    if (!token) {
      set({ user: null, token: null, workspaces: [], isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await authService.getMe();
      const user = res.data.user;
      const workspaces = res.data.workspaces || [];
      const activeWorkspaceId =
        user.lastActiveWorkspace ||
        (workspaces.length > 0 ? workspaces[0]._id : null);

      set({
        user,
        workspaces,
        activeWorkspaceId,
        isLoading: false,
      });
    } catch (err) {
      console.warn('Failed to restore session:', err.message);
      window.localStorage.removeItem('worksphere_token');
      set({ user: null, token: null, workspaces: [], activeWorkspaceId: null, isLoading: false });
    }
  },

  setAuth: (user, token, workspaces = []) => {
    if (token) {
      window.localStorage.setItem('worksphere_token', token);
    }
    const activeWorkspaceId =
      user?.lastActiveWorkspace ||
      (workspaces.length > 0 ? workspaces[0]._id : null);

    set({
      user,
      token,
      workspaces,
      activeWorkspaceId,
      isLoading: false,
    });
  },

  setActiveWorkspaceId: (workspaceId) => {
    const { user } = get();
    set({ activeWorkspaceId: workspaceId });
    if (user) {
      authService.updateProfile({ lastActiveWorkspace: workspaceId }).catch(() => {});
    }
  },

  updateUser: (updatedUser) => {
    set((state) => ({ user: { ...state.user, ...updatedUser } }));
  },

  setWorkspaces: (workspaces) => {
    set({ workspaces });
  },

  addWorkspace: (workspace) => {
    set((state) => {
      const exists = state.workspaces.some((w) => w._id === workspace._id);
      return {
        workspaces: exists
          ? state.workspaces.map((w) => (w._id === workspace._id ? workspace : w))
          : [...state.workspaces, workspace],
      };
    });
  },

  setTheme: (theme) => {
    window.localStorage.setItem('worksphere_theme', theme);
    set({ theme });
    applyThemeToDOM(theme);
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore
    } finally {
      window.localStorage.removeItem('worksphere_token');
      set({
        user: null,
        token: null,
        workspaces: [],
        activeWorkspaceId: null,
        isLoading: false,
      });
    }
  },
}));

export const applyThemeToDOM = (theme) => {
  const root = document.documentElement;
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
