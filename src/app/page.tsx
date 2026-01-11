'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/mock/types';

export default function SplashPage() {
    const router = useRouter();
    const { user, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        // Simulate init loading + check auth
        const init = async () => {
            await checkAuth();
            const currentUser = useAuthStore.getState().user;

            // Delay for splash effect
            setTimeout(() => {
                if (!currentUser) {
                    router.push('/login');
                } else {
                    // Redirect based on role
                    switch (currentUser.role) {
                        case UserRole.WORKER:
                            router.push('/app/worker/dashboard');
                            break;
                        case UserRole.MANAGER:
                            router.push('/app/manager/overview');
                            break;
                        case UserRole.ADMIN:
                            router.push('/app/admin/overview');
                            break;
                        default:
                            router.push('/app/profile');
                    }
                }
            }, 1500);
        };

        init();
    }, [checkAuth, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-10 w-10 text-white"
                    >
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4 8 4v14" />
                        <path d="M17 21v-8.666a2 2 0 0 0-3.92-.42" />
                        <path d="M11 21v-8.8a2 2 0 0 0-4 0V21" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-widest uppercase">System Loading</h1>
                <Loader2 className="mt-8 h-8 w-8 animate-spin text-blue-500" />
            </div>
        </div>
    );
}
