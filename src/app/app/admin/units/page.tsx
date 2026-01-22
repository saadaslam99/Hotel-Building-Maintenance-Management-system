'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/mock/api';
import { Project } from '@/mock/types';
import { Skeleton } from '@/components/ui/skeleton';
import { UnitsTab } from '@/components/admin/units-tab';
import { Home } from 'lucide-react';

export default function UnitsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = 'u1';

    const fetchProjects = useCallback(() => {
        setLoading(true);
        api.projects.getAll().then((data) => {
            setProjects(data || []);
            setLoading(false);
        }).catch(() => {
            setProjects([]);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    if (loading) {
        return <Skeleton className="h-96" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Home className="h-6 w-6" />
                        Units
                    </h1>
                    <p className="text-muted-foreground">
                        Manage all units and occupancy across projects.
                    </p>
                </div>
            </div>

            <UnitsTab projects={projects} currentUserId={currentUserId} />
        </div>
    );
}
