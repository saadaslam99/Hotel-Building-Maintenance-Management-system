'use client';

// Similar to Manager overview
import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBarChart, PriorityPieChart } from '@/components/manager/charts';
import { ShieldAlert, Users, Building, Activity } from 'lucide-react';

export default function AdminOverview() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.issues.getAll(),
            api.users.getAll(),
            api.projects.getAll()
        ]).then(([i, u, p]) => {
            setIssues(i);
            setUsers(u);
            setProjects(p);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <Skeleton className="h-96" />;
    }

    const kpis = [
        { label: 'Total Projects', value: projects.length, icon: Building, color: 'text-blue-500' },
        { label: 'Total Users', value: users.length, icon: Users, color: 'text-green-500' },
        { label: 'Total Issues', value: issues.length, icon: ShieldAlert, color: 'text-red-500' },
        { label: 'Active Assignments', value: '4', icon: Activity, color: 'text-yellow-500' }, // Mock
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>

            <div className="grid gap-4 md:grid-cols-4">
                {kpis.map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
                                <Icon className={`h-4 w-4 ${k.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{k.value}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>System Activity</CardTitle></CardHeader>
                    <CardContent>
                        <StatusBarChart data={[
                            { name: 'Open', value: issues.filter(i => i.status === 'OPEN').length },
                            { name: 'Resolved', value: issues.filter(i => i.status === 'RESOLVED').length }
                        ]} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>User Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <PriorityPieChart data={[
                            { name: 'Managers', value: users.filter(u => u.role === 'MANAGER').length },
                            { name: 'Workers', value: users.filter(u => u.role === 'WORKER').length },
                            { name: 'Admins', value: users.filter(u => u.role === 'ADMIN').length },
                        ]} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
