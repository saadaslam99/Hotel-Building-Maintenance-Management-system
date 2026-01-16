'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { User, UserRole } from '@/mock/types';
import { UserModal } from '@/components/manager/user-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, UserX, UserCheck, AlertTriangle } from 'lucide-react';
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

export default function WorkersPage() {
    const [workers, setWorkers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchWorkers = async () => {
        const data = await api.users.getWorkers();
        setWorkers(data);
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleDeactivate = async (user: User) => {
        setLoading(true);
        try {
            await api.users.deactivate(user.id, 'Deactivated by admin');
            toast.success(`${user.full_name} has been deactivated.`);
            fetchWorkers();
        } catch (error) {
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
            fetchWorkers();
        } catch (error) {
            toast.error('Failed to reactivate user.');
        } finally {
            setLoading(false);
        }
    };

    const activeWorkers = workers.filter(w => w.active);
    const inactiveWorkers = workers.filter(w => !w.active);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Worker Management</h1>
                    <p className="text-muted-foreground">Manage all workers in the system.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Worker
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{workers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeWorkers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Inactive</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{inactiveWorkers.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Workers</CardTitle>
                    <CardDescription>
                        Workers can be deactivated but never deleted. All records are preserved.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Employee ID</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id} className={!worker.active ? 'opacity-60' : ''}>
                                    <TableCell className="font-medium">{worker.full_name}</TableCell>
                                    <TableCell>{worker.employee_id}</TableCell>
                                    <TableCell>{worker.phone || '-'}</TableCell>
                                    <TableCell>
                                        {worker.active ? (
                                            <Badge className="bg-green-500">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(worker)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {worker.active ? (
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
                                                            Deactivate Worker?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will deactivate <strong>{worker.full_name}</strong>. They will no longer be able to log in.
                                                            <br /><br />
                                                            <em>Note: Data is never deleted. You can reactivate this user at any time.</em>
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeactivate(worker)} disabled={loading}>
                                                            Deactivate
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-700" onClick={() => handleReactivate(worker)} disabled={loading}>
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
                role={UserRole.WORKER}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={fetchWorkers}
            />
        </div>
    );
}
