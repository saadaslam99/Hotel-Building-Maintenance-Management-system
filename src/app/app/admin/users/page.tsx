'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/mock/api';
import { User, UserRole } from '@/mock/types';
import { UserModal } from '@/components/manager/user-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, UserX, UserCheck, AlertTriangle, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/ui/page-header';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRole, setModalRole] = useState<UserRole>(UserRole.WORKER);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    const fetchUsers = async () => {
        const data = await api.users.getAll();
        setUsers(data);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        let result = users;

        if (roleFilter !== 'ALL') {
            result = result.filter(u => u.role === roleFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.full_name.toLowerCase().includes(query) ||
                u.employee_id.toLowerCase().includes(query)
            );
        }

        return result;
    }, [users, roleFilter, searchQuery]);

    const handleCreate = (role: UserRole) => {
        setSelectedUser(null);
        setModalRole(role);
        setModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setModalRole(user.role);
        setModalOpen(true);
    };

    const handleDeactivate = async (user: User) => {
        setLoading(true);
        try {
            await api.users.deactivate(user.id, 'Deactivated by admin');
            toast.success(`${user.full_name} has been deactivated.`);
            fetchUsers();
        } catch {
            toast.error('Failed to deactivate user.');
        } finally {
            setLoading(false);
        }
    };

    const handleReactivate = async (user: User) => {
        setLoading(true);
        try {
            await api.users.reactivate(user.id);
            toast.success(`${user.full_name} has been reactivated.`);
            fetchUsers();
        } catch {
            toast.error('Failed to reactivate user.');
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20';
            case UserRole.MANAGER: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20';
            case UserRole.WORKER: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20';
            default: return '';
        }
    };

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === UserRole.ADMIN).length,
        managers: users.filter(u => u.role === UserRole.MANAGER).length,
        workers: users.filter(u => u.role === UserRole.WORKER).length,
        active: users.filter(u => u.active).length,
        inactive: users.filter(u => !u.active).length,
    };

    return (
        <div className="space-y-6 container mx-auto p-6 max-w-7xl">
            <PageHeader
                title="User Management"
                description="Manage all users across all roles."
                icon={Users}
            >
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleCreate(UserRole.WORKER)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Worker
                    </Button>
                    <Button variant="outline" onClick={() => handleCreate(UserRole.MANAGER)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Manager
                    </Button>
                    <Button onClick={() => handleCreate(UserRole.ADMIN)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Admin
                    </Button>
                </div>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Managers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.managers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Workers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.workers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-500">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-500">Inactive</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-500">{stats.inactive}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                        Users can be deactivated but never deleted. All records are preserved permanently.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Roles</SelectItem>
                                <SelectItem value="ADMIN">Admins</SelectItem>
                                <SelectItem value="MANAGER">Managers</SelectItem>
                                <SelectItem value="WORKER">Workers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Employee ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className={!user.active ? 'opacity-60' : ''}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>{user.employee_id}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.phone || '-'}</TableCell>
                                    <TableCell>
                                        {user.active ? (
                                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                                                Inactive
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {user.active ? (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                                                        <UserX className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="flex items-center gap-2">
                                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                            Deactivate User?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will deactivate <strong>{user.full_name}</strong> ({user.role}).
                                                            They will no longer be able to log in.
                                                            <br /><br />
                                                            <em>Note: Data is never deleted. You can reactivate this user at any time.</em>
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeactivate(user)} disabled={loading}>
                                                            Deactivate
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-700" onClick={() => handleReactivate(user)} disabled={loading}>
                                                <UserCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <UserModal
                user={selectedUser}
                role={modalRole}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={fetchUsers}
            />
        </div>
    );
}
