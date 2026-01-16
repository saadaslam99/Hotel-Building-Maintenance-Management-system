'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/mock/types';
import {
    LayoutDashboard, PlusCircle, ListTodo, CheckSquare,
    Users, Building, Briefcase, Key, FileText, Settings, LogOut, ShieldAlert, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const getLinks = () => {
        if (!user) return [];

        switch (user.role) {
            case UserRole.WORKER:
                return [
                    { href: '/app/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/app/worker/report-issue', label: 'Report Issue', icon: PlusCircle },
                    { href: '/app/worker/issues', label: 'My Issues', icon: ListTodo },
                    { href: '/app/worker/work-verification', label: 'Verification', icon: CheckSquare },
                ];
            case UserRole.MANAGER:
                return [
                    { href: '/app/manager/overview', label: 'Overview', icon: LayoutDashboard },
                    { href: '/app/manager/issues', label: 'Issues', icon: ListTodo },
                    { href: '/app/manager/workers', label: 'Workers', icon: Users },
                    { href: '/app/manager/projects', label: 'Projects', icon: Building },
                    { href: '/app/manager/assignments', label: 'Assignments', icon: Briefcase },
                    { href: '/app/manager/units', label: 'Units & Clients', icon: Key },
                    { href: '/app/manager/reports', label: 'Reports', icon: FileText },
                ];
            case UserRole.ADMIN:
                return [
                    { href: '/app/admin/overview', label: 'System Overview', icon: LayoutDashboard },
                    { href: '/app/admin/users', label: 'All Users', icon: Users },
                    { href: '/app/admin/managers', label: 'Managers', icon: Users },
                    { href: '/app/admin/workers', label: 'Workers', icon: Users },
                    { href: '/app/admin/issues', label: 'Active Issues', icon: ListTodo },
                    { href: '/app/admin/history', label: 'History', icon: Archive },
                    { href: '/app/admin/logs', label: 'System Logs', icon: FileText },
                    { href: '/app/admin/projects', label: 'All Projects', icon: Building },
                    { href: '/app/admin/system', label: 'System Settings', icon: ShieldAlert },
                ];
            default:
                return [];
        }
    };

    const links = getLinks();

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
