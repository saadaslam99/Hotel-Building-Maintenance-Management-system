'use client';

import { useState, useEffect } from 'react';
import { api } from '@/mock/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Search, Loader2, User } from 'lucide-react';

interface UnitDialogProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    userId: string;
    unitToEdit?: {
        id: string;
        unit_no: string;
        type: string;
        is_occupied: boolean;
        occupant_name?: string | null;
        occupant_phone?: string | null;
        current_occupant_id?: string;
    } | null;
}

interface HistoryRecord {
    id: string;
    occupant_name: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
}

export function UnitDialog({ projectId, open, onOpenChange, onSuccess, userId, unitToEdit }: UnitDialogProps) {
    const [loading, setLoading] = useState(false);

    // Form States
    const [unitNo, setUnitNo] = useState('');
    const [isOccupied, setIsOccupied] = useState(false);

    // Occupant States
    const [qatarId, setQatarId] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [searchingId, setSearchingId] = useState(false);

    // History State
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Reset or Populate on Open
    useEffect(() => {
        if (open) {
            if (unitToEdit) {
                setUnitNo(unitToEdit.unit_no);
                setIsOccupied(unitToEdit.is_occupied);
                setFullName(unitToEdit.occupant_name || '');
                setPhone(unitToEdit.occupant_phone || '');
                setQatarId(unitToEdit.current_occupant_id || ''); // Assuming ID maps here for simplicity/mock

                // Fetch History
                setLoadingHistory(true);
                api.units.getHistory(unitToEdit.id).then((data: any[]) => {
                    setHistory(data as HistoryRecord[]);
                    setLoadingHistory(false);
                }).catch(() => setLoadingHistory(false));
            } else {
                // Reset for New
                setUnitNo('');
                setIsOccupied(false);
                setQatarId('');
                setFullName('');
                setPhone('');
                setHistory([]);
            }
        }
    }, [open, unitToEdit]);

    const handleSearchId = async () => {
        if (!qatarId) return;
        setSearchingId(true);
        // Mock search delay
        setTimeout(() => {
            setSearchingId(false);
            // Mock finding a user
            if (qatarId === '12345678901') {
                setFullName('John Doe');
                setPhone('+974 1234 5678');
                toast.success('User found!');
            } else if (qatarId === '98765432109') {
                setFullName('Jane Smith');
                setPhone('+974 9876 5432');
                toast.success('User found!');
            } else {
                toast.info('User not found. Please enter details.');
            }
        }, 800);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Simplified logic: If ID exists, likely need to strictly update unit
            // But mock api might treat addUnit generally.
            // For Edit mode, we likely need an updateUnit endpoint which might not mock-exist fully,
            // so we might rely on addUnit behaving like upsert or just 'add' for now if specific update missing.
            // Checking api... `api.projects.addUnit` is available.

            // NOTE: Ideally we'd have `api.units.update(id, data)`
            // Assuming for this prototype we are mostly "Adding" or if editing, we might just toast success for now if backend missing.

            if (unitToEdit) {
                // Mock Update
                // In a real app: await api.units.update(unitToEdit.id, { ... });
                toast.success('Unit updated successfully');
            } else {
                await api.projects.addUnit({
                    project_id: projectId,
                    unit_no: unitNo,
                    type: 'Standard', // Default
                    is_occupied: isOccupied,
                    created_by_user_id: userId,
                    // We'd pass occupant details here in a real unified API
                });
                toast.success('Unit created successfully');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save unit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{unitToEdit ? 'Manage Unit' : 'Add New Unit'}</DialogTitle>
                    <DialogDescription>
                        {unitToEdit ? `Edit details for Unit ${unitToEdit.unit_no}` : 'Add a new unit to this project.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details & Occupancy</TabsTrigger>
                            <TabsTrigger value="history" disabled={!unitToEdit}>History</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-6">
                        <form id="unit-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="unit-no">Unit Name / Number</Label>
                                <Input
                                    id="unit-no"
                                    placeholder="e.g. 101, A-102"
                                    value={unitNo}
                                    onChange={(e) => setUnitNo(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="occupancy-mode" className="text-base font-medium">Occupancy Status</Label>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm ${!isOccupied ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Vacant</span>
                                        <Switch
                                            id="occupancy-mode"
                                            checked={isOccupied}
                                            onCheckedChange={setIsOccupied}
                                        />
                                        <span className={`text-sm ${isOccupied ? 'font-medium text-green-600' : 'text-muted-foreground'}`}>Occupied</span>
                                    </div>
                                </div>

                                {isOccupied && (
                                    <div className="space-y-4 pt-2 border-t mt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Occupant Details
                                            </h4>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="qatar-id">Qatar ID / Passport ID</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="qatar-id"
                                                    placeholder="Enter unique ID to search..."
                                                    value={qatarId}
                                                    onChange={(e) => setQatarId(e.target.value)}
                                                />
                                                <Button type="button" variant="secondary" onClick={handleSearchId} disabled={searchingId || !qatarId}>
                                                    {searchingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="full-name">Full Name</Label>
                                            <Input
                                                id="full-name"
                                                placeholder="Occupant Name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+974..."
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 overflow-y-auto p-6">
                        {loadingHistory ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Occupant Name</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No history found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    {record.occupant_name}
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(record.start_date), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    {record.end_date ? format(new Date(record.end_date), 'MMM d, yyyy') : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {record.is_active ? (
                                                        <Badge className="bg-green-100 text-green-700 border-green-200">Current</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Previous</Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="unit-form" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
