'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/mock/api';
import { Project } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, Settings } from 'lucide-react';
import { UnitDialog } from './unit-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface UnitsTabProps {
    projects: Project[];
    currentUserId: string;
}

interface EnrichedUnit {
    id: string;
    unit_no: string;
    type: string;
    is_occupied: boolean;
    occupant_name: string | null;
    occupant_phone: string | null;
    current_occupant_id?: string;
}

export function UnitsTab({ projects, currentUserId }: UnitsTabProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [units, setUnits] = useState<EnrichedUnit[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<EnrichedUnit | null>(null);

    // Initialize selection if projects exist
    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    const fetchUnits = useCallback(() => {
        if (!selectedProjectId) return;

        setLoading(true);
        Promise.all([
            api.projects.getUnits(selectedProjectId),
            api.occupants.getAllActive()
        ]).then(([projectUnits, activeOccupants]) => {
            const enriched: EnrichedUnit[] = projectUnits.map(u => {
                const active = activeOccupants.find((o: any) => o.id === u.current_occupant_id);
                return {
                    id: u.id,
                    unit_no: u.unit_no,
                    type: u.type || 'Unknown',
                    is_occupied: u.is_occupied,
                    current_occupant_id: u.current_occupant_id,
                    occupant_name: active ? active.name : null,
                    occupant_phone: active ? active.phone : null,
                };
            });
            setUnits(enriched);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [selectedProjectId]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleAddUnit = () => {
        setSelectedUnit(null);
        setIsDialogOpen(true);
    };

    const handleManageUnit = (unit: EnrichedUnit) => {
        setSelectedUnit(unit);
        setIsDialogOpen(true);
    };

    const filteredUnits = units.filter(u =>
        u.unit_no.toLowerCase().includes(search.toLowerCase()) ||
        (u.occupant_name && u.occupant_name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Units</CardTitle>
                    <CardDescription>
                        View and manage units and their occupants for each project.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
                        <div className="flex gap-4 items-center flex-1 w-full">
                            <div className="w-[300px]">
                                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search units or occupants..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button onClick={handleAddUnit} disabled={!selectedProjectId}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Unit
                        </Button>
                    </div>

                    {loading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Unit Number</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Occupant</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUnits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            {selectedProjectId ? 'No units found matching your search.' : 'Select a project to view units.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUnits.map((unit) => (
                                        <TableRow key={unit.id}>
                                            <TableCell className="font-medium">
                                                {unit.unit_no}
                                            </TableCell>
                                            <TableCell>
                                                {unit.is_occupied ? (
                                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Occupied</Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">Available</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {unit.occupant_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {unit.occupant_name}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{unit.occupant_phone || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleManageUnit(unit)}
                                                >
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Manage
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <UnitDialog
                projectId={selectedProjectId}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={fetchUnits}
                userId={currentUserId}
                unitToEdit={selectedUnit}
            />
        </div>
    );
}
