import { create } from 'zustand';
import authApi from '../api/auth';

const USER_KEY = 'erp_user';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    const response = await authApi.login(email, password);
    set({ user: response.user, accessToken: response.accessToken, isAuthenticated: true });
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem(USER_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) set({ user: JSON.parse(stored) });
      const { accessToken } = await authApi.refresh();
      set({ accessToken });
      const me = await authApi.me();
      set({ user: me, accessToken, isAuthenticated: true });
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch {
      localStorage.removeItem(USER_KEY);
      set({ user: null, accessToken: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),

  clearAuth: () => {
    localStorage.removeItem(USER_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
