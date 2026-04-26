import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '@/lib/index';

interface AuthStore {
  type: AuthState['type'];
  juror: AuthState['juror'];
  login: (data: AuthState) => void;
  logout: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      type: null as AuthState['type'],
      juror: null as AuthState['juror'],
      login: (data: AuthState) => set({ type: data.type, juror: data.juror }),
      logout: () => set({ type: null, juror: null }),
    }),
    { name: 'jury-auth' }
  )
);
