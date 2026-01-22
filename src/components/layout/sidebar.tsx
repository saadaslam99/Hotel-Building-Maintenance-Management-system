'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { getNavItemsForRole } from '@/lib/auth/access-control';
import {
    Settings, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };


    const links = user ? getNavItemsForRole(user.role) : [];

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-slate-900 text-white", className)}>
            <div className="space-y-4 py-4">
                <div className="px-4 py-2">
                    <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
                        Maintenance App
                    </h2>
                    <div className="px-2 text-xs text-slate-400">
                        {user?.role} PORTAL
                    </div>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link key={link.href} href={link.href}>
                                    <Button
                                        variant={pathname === link.href ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start",
                                            pathname === link.href ? "bg-slate-800 text-white hover:bg-slate-700" : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )}
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        {link.label}
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="px-3 py-2 mt-auto">
                    <div className="space-y-1">
                        <Link href="/app/settings">
                            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800">
                                <Settings className="mr-2 h-4 w-4" />
                                Profile / Settings
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
