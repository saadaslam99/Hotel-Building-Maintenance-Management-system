'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/mock/api';
import { Project, Unit } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, MapPin, Calendar, Users, Home, Plus } from 'lucide-react';
import { format } from 'date-fns';

import { UnitDetailsDialog } from '@/components/admin/unit-details-dialog';

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchData = () => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            api.projects.getById(id),
            api.projects.getUnits(id)
        ]).then(([projectData, unitsData]) => {
            if (projectData) {
                setProject(projectData);
                setUnits(unitsData);
            }
            setLoading(false);
        }).catch((err) => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleUnitClick = (unit: Unit) => {
        setSelectedUnit(unit);
    };

    if (loading) {
        return <Skeleton className="h-96" />;
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <h2 className="text-2xl font-bold">Project not found</h2>
                <Button variant="link" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        {project.name}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MapPin className="h-3 w-3" />
                        {project.location || 'No location specified'}
                    </div>
                </div>
                <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                    Active
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Home className="h-5 w-5 text-blue-500" />
                            {units.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Occupied Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-orange-500" />
                            {units.filter(u => u.is_occupied).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Created On</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            {format(new Date(project.created_at), 'PP')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Units</CardTitle>
                        <CardDescription>List of all units in this project.</CardDescription>
                    </div>
                    <Button onClick={() => setSelectedUnit(null)} variant="outline" size="sm" className="hidden">
                        {/* Hidden button to reset state if needed, better handled below */}
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Unit
                    </Button>
                </CardHeader>
                <CardContent>
                    {units.length === 0 ? (
                        <p className="text-muted-foreground py-4">No units found.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {units.map(unit => (
                                <div
                                    key={unit.id}
                                    className="p-4 border rounded-lg flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                                    onClick={() => handleUnitClick(unit)}
                                >
                                    <span className="font-semibold">{unit.unit_no}</span>
                                    <span className={`text-xs mt-1 ${unit.is_occupied ? 'text-orange-500' : 'text-green-500'}`}>
                                        {unit.is_occupied ? 'Occupied' : 'Vacant'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog for Editing Existing Unit */}
            <UnitDetailsDialog
                unit={selectedUnit}
                projectId={id}
                open={!!selectedUnit}
                onOpenChange={(open) => !open && setSelectedUnit(null)}
                onSuccess={fetchData}
            />

            {/* Dialog for Creating New Unit */}
            <UnitDetailsDialog
                unit={null}
                projectId={id}
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={fetchData}
            />
        </div>
    );
}
