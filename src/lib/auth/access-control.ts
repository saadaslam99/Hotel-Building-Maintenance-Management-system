import { UserRole } from '@/mock/types';
import {
    LayoutDashboard,
    Users,
    ListTodo,
    Archive,
    FileText,
    Building,
    ShieldAlert,
    CheckSquare,
    PlusCircle,
    Home
} from 'lucide-react';

export interface NavItem {
    label: string;
    href: string;
    icon: any; // Lucide icon component
}

const ADMIN_NAV_ITEMS: NavItem[] = [
    { label: 'System Overview', href: '/app/admin/overview', icon: LayoutDashboard },
    { label: 'All Users', href: '/app/admin/users', icon: Users },
    { label: 'Managers', href: '/app/admin/managers', icon: Users },
    { label: 'Workers', href: '/app/admin/workers', icon: Users },
    { label: 'Issues', href: '/app/admin/issues', icon: ListTodo },
    { label: 'Units', href: '/app/admin/units', icon: Home },
    { label: 'History', href: '/app/admin/history', icon: Archive },
    { label: 'System Logs', href: '/app/admin/logs', icon: FileText },
    { label: 'All Projects', href: '/app/admin/projects', icon: Building },
    { label: 'System Settings', href: '/app/admin/system', icon: ShieldAlert },
];

const MANAGER_NAV_ITEMS: NavItem[] = [
    { label: 'System Overview', href: '/app/manager/overview', icon: LayoutDashboard },
    { label: 'Workers Tab', href: '/app/manager/workers', icon: Users },
    { label: 'Issues Tab', href: '/app/manager/issues', icon: ListTodo },
    { label: 'All Projects', href: '/app/manager/projects', icon: Building },
    // Profile/Settings is handled in the sidebar footer usually, but if needed in main nav:
    // { label: 'Profile/Settings', href: '/app/profile', icon: Settings },
    // Existing manager items that might be needed or are replaced by the above restricted list:
    // Assignments, Units, Reports seem to be removed based on "limited access to specific tabs" request.
    // However, sticking to the explicit allowed list from the prompt.
];

const WORKER_NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/app/worker/dashboard', icon: LayoutDashboard },
    { label: 'Report Issue', href: '/app/worker/report-issue', icon: PlusCircle },
    { label: 'My Issues', href: '/app/worker/issues', icon: ListTodo },
    { label: 'Verification', href: '/app/worker/work-verification', icon: CheckSquare },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
    switch (role) {
        case UserRole.ADMIN:
            return ADMIN_NAV_ITEMS;

        case UserRole.SUB_ADMIN:
            // Sub-Admin (Owner) Access: All Admin tabs EXCEPT All User Tab, System Logs, System Settings.
            return ADMIN_NAV_ITEMS.filter(item =>
                item.label !== 'All Users' &&
                item.label !== 'System Logs' &&
                item.label !== 'System Settings'
            );

        case UserRole.MANAGER:
            // Manager Access: specific list.
            // Note: The prompt asked for "System Overview, Workers Tab, Issues Tab, All Projects, Profile/Settings Tab".
            // I'm mapping these to the Manager's routes where possible to preserve functionality, 
            // or I could map them to Admin routes if the intention is to use the Admin views.
            // Given "Move Admin Folder", mapping to Admin routes might be safer for "Unification", 
            // but Manager routes exist and likely have manager-specific logic.
            // I will default to using the defined MANAGER_NAV_ITEMS which map to /app/manager/*.
            return MANAGER_NAV_ITEMS;

        case UserRole.WORKER:
            return WORKER_NAV_ITEMS;

        default:
            return [];
    }
}
