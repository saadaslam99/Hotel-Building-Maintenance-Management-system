'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { User, UserRole, Project } from '@/mock/types';
import { UserModal } from '@/components/manager/user-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, UserX, UserCheck, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const [workers, setWorkers] = useState<any[]>([]); // Typed as any to support enriched fields
    const [projects, setProjects] = useState<Project[]>([]);

    // Edit/Create Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Change Project Modal State
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [userToAssign, setUserToAssign] = useState<any | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        const [workersData, projectsData] = await Promise.all([
            api.users.getWorkers(),
            api.projects.getAll()
        ]);
        setWorkers(workersData);
        setProjects(projectsData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const openProjectModal = (worker: any) => {
        setUserToAssign(worker);
        setSelectedProjectId(worker.project_id || '');
        setProjectModalOpen(true);
    };

    const handleSaveProjectAssignment = async () => {
        if (!userToAssign || !selectedProjectId) return;
        setLoading(true);
        try {
            await api.projects.assignWorker({
                worker_user_id: userToAssign.id,
                project_id: selectedProjectId,
                assigned_by_user_id: 'admin-id', // Mock admin ID
            });
            toast.success(`Project updated successfully.`);
            fetchData();
            setProjectModalOpen(false);
        } catch (error) {
            toast.error('Failed to update project assignment.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (user: User) => {
        setLoading(true);
        try {
            await api.users.deactivate(user.id, 'Deactivated by admin');
            toast.success(`${user.full_name} has been deactivated.`);
            fetchData();
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
            fetchData();
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
                                <TableHead>Project</TableHead>
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
                                        <Badge variant="outline">
                                            {worker.project_name || 'Not Assigned'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {worker.active ? (
                                            <Badge className="bg-green-500">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {/* 3-Dot Menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(worker)}>
                                                    Manage Worker
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openProjectModal(worker)}>
                                                    Change Project
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {/* Deactivate/Reactivate Logic inside Menu? Or keep separate? 
                                                    User req said "Replace pencil with 3-dot... clicking 3-dot must open menu with exactly two options: Manage Worker, Change Project"
                                                    BUT we also have the Deactivate/Reactivate button separate in the current UI.
                                                    Let's Keep the Deactivate button separate for visibility as per "UX consistent" unless specified to move.
                                                    Wait, "Replace pencil edit icon with 3-dot menu". It didn't explicitly say remove the deactivate button.
                                                    But usually "Actions" column has the menu.
                                                    Let's put the deactivate/reactivate logic INSIDE "Manage Worker" (Edit Modal) or keep the button separate next to the menu?
                                                    The prompt says: "Clicking the 3-dot icon must open a small menu with exactly two options: Manage Worker, Change Project".
                                                    So I should ONLY put those two in the menu.
                                                    I will keep the Deactivate/Reactivate button adjacent to the 3-dot menu if possible, OR rely on "Manage Worker" to handle it?
                                                    The prompt says "Replace it with a three-dot options menu icon for each worker row."
                                                    It implies replacing ONLY the pencil.
                                                    I will leave the Deactivate button (UserX/UserCheck) as a separate sibling button for now to be safe and accessible.
                                                */}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Keep Deactivate/Reactivate Button visible for easy access */}
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

            {/* Manage Worker Modal */}
            <UserModal
                user={selectedUser}
                role={UserRole.WORKER}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={fetchData}
            />

            {/* Change Project Modal */}
            <Dialog open={projectModalOpen} onOpenChange={setProjectModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change Project Assignment</DialogTitle>
                        <DialogDescription>
                            Assign a new project to <strong>{userToAssign?.full_name}</strong>. Previous assignments will be replaced.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="project" className="text-right">
                                Project
                            </Label>
                            <Select onValueChange={setSelectedProjectId} value={selectedProjectId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSaveProjectAssignment} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
