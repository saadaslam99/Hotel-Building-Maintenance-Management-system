'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Unit, Project } from '@/mock/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UnitsPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('ALL');

    useEffect(() => {
        api.projects.getAll().then(setProjects);
    }, []);

    useEffect(() => {
        if (selectedProject !== 'ALL') {
            api.projects.getUnits(selectedProject).then(setUnits);
        } else {
            // Mock: fetch first project units or none
            setUnits([]);
        }
    }, [selectedProject]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Units & Clients</h1>

            <div className="w-[200px]">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Select Project...</SelectItem>
                        {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Unit No</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Occupancy</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {units.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        Select a project to view units.
                                    </TableCell>
                                </TableRow>
                            ) : units.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.unit_no}</TableCell>
                                    <TableCell>{u.type || '-'}</TableCell>
                                    <TableCell>
                                        {u.is_occupied ? <Badge className="bg-orange-500">Occupied</Badge> : <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Vacant</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="link" size="sm">Manage Client</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
