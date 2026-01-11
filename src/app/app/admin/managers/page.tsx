'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { User, UserRole } from '@/mock/types';
import { UserModal } from '@/components/manager/user-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil } from 'lucide-react';

export default function ManagersPage() {
    const [managers, setManagers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchManagers = async () => {
        const data = await api.users.getManagers();
        setManagers(data);
    };

    useEffect(() => {
        fetchManagers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Manager Management</h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Manager
                </Button>
            </div>

            <Card>
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
                            {managers.map((manager) => (
                                <TableRow key={manager.id}>
                                    <TableCell className="font-medium">{manager.full_name}</TableCell>
                                    <TableCell>{manager.employee_id}</TableCell>
                                    <TableCell>{manager.phone}</TableCell>
                                    <TableCell>
                                        {manager.active ? (
                                            <Badge className="bg-green-500">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(manager)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <UserModal
                user={selectedUser}
                role={UserRole.MANAGER}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={fetchManagers}
            />
        </div>
    );
}
