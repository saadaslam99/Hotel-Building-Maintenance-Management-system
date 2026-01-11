import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/mock/types';
import { api } from '@/mock/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    login: (employeeId: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            login: async (employeeId, password) => {
                set({ isLoading: true, error: null });
                try {
                    const { user, token } = await api.auth.login(employeeId, password);
                    set({ user, token, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set({ user: null, token: null });
                // Optional: clear localstorage DB if we wanted total reset, but we keep DB
            },

            checkAuth: async () => {
                const { user, token } = get();
                if (token && user) {
                    // Verify session is still valid (mock)
                    try {
                        const refreshedUser = await api.auth.me(user.id);
                        set({ user: refreshedUser });
                    } catch (e) {
                        set({ user: null, token: null });
                    }
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);
