import { ApiClient } from './api-client';
import { User, UserRole } from '@/mock/types';
import { login as mockLogin, me as mockMe } from '@/mock/actions';

interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: {
            id: string;
            role: UserRole;
        }
    }
}

interface MeResponse {
    success: boolean;
    data: {
        user: {
            id: string;
            employee_id: string;
            role: UserRole;
            active: boolean;
            [key: string]: any;
        }
    }
}

export const authService = {
    async login(employee_id: string, password: string): Promise<{ token: string; user: Partial<User> }> {
        try {
            const response = await ApiClient.post<LoginResponse>('/auth/login', {
                employee_id,
                password
            });

            if (response.success && response.data) {
                return {
                    token: response.data.token,
                    user: {
                        id: response.data.user.id,
                        role: response.data.user.role,
                        employee_id: employee_id,
                        active: true,
                    }
                };
            }
            throw new Error(response.message || 'Login failed');
        } catch (error: any) {
            console.warn('API connection failed, falling back to mock login:', error);
            // Fallback to mock
            try {
                const { user, token } = await mockLogin(employee_id, password);
                return { user, token };
            } catch (mockError: any) {
                console.error('Mock login failed:', mockError);
                throw new Error('Login failed: ' + (mockError.message || 'Unknown error'));
            }
        }
    },

    async me(userId?: string): Promise<User> {
        try {
            const response = await ApiClient.get<MeResponse>('/auth/me');
            return response.data.user as unknown as User;
        } catch (error: any) {
            console.warn('API /me failed, falling back to mock me:', error);

            if (userId) {
                try {
                    console.log('Attempting mock me for:', userId);
                    return await mockMe(userId);
                } catch (mockError) {
                    console.error('Mock me failed:', mockError);
                }
            }

            throw error;
        }
    },
};
