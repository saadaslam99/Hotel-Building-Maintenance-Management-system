'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, checkAuth } = useAuthStore();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (isClient && !isLoading && !user) {
            router.push('/login');
        }
    }, [isClient, isLoading, user, router]);

    if (!isClient || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) return null; // Will redirect

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <Sidebar />
            </div>

            {/* Mobile Top Bar */}
            <div className="md:hidden sticky top-0 z-30 flex h-16 w-full items-center border-b bg-slate-900 px-4 shadow-sm">
                <MobileNav />
                <span className="ml-4 font-bold text-white">Maintenance App</span>
            </div>

            {/* Main Content */}
            <div className="md:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
