import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/mock/types';
import { authService } from '@/services/auth-service';


interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    login: (employeeId: string, password: string) => Promise<User>;
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
                    const { user, token } = await authService.login(employeeId, password);
                    set({ user: user as User, token, isLoading: false });
                    return user as User;
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
                    // Try to verify session with backend
                    try {
                        // If backend has /auth/me, use it:
                        const refreshedUser = await authService.me(user.id);
                        set({ user: refreshedUser });
                    } catch (e) {
                        console.warn('Session verification failed:', e);
                        // Optional: Don't logout immediately on network error, only on 401?
                        // For now we persist if it fails to avoid aggressive logout loop if API is missing /me
                        // set({ user: null, token: null }); 
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
