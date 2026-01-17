// Server Component
import { api } from '@/mock/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBarChart, PriorityPieChart } from '@/components/manager/charts';
import { IssuesOverviewChartWithColors } from '@/components/admin/charts';
import { RecentIssuesTable } from '@/components/admin/recent-issues-table';
import { ShieldAlert, Users, Building, Activity } from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';

export default async function AdminOverview() {
    const [issues, users, projects] = await Promise.all([
        api.issues.getAll(),
        api.users.getAll(),
        api.projects.getAll()
    ]);

    const kpis = [
        { label: 'Total Projects', value: projects.length, icon: Building, color: 'text-blue-500' },
        { label: 'Total Users', value: users.length, icon: Users, color: 'text-green-500' },
        { label: 'Total Issues', value: issues.length, icon: ShieldAlert, color: 'text-red-500' },
        { label: 'Active Assignments', value: '4', icon: Activity, color: 'text-yellow-500' }, // Mock
    ];

    // Compute Issue Stats for Chart
    const issueStats = [
        { name: 'Total', value: issues.length },
        { name: 'Open', value: issues.filter(i => i.status === 'OPEN').length },
        { name: 'Pending', value: issues.filter(i => i.status === 'IN_PROGRESS').length },
        { name: 'Resolved', value: issues.filter(i => i.status === 'RESOLVED' && !i.verified).length },
        { name: 'Verified', value: issues.filter(i => i.verified).length },
    ];

    return (
        <div className="space-y-6 container mx-auto p-6 max-w-7xl">
            <PageHeader
                title="System Overview"
                description="Overview of system performance and activity."
                icon={Activity}
            />

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

            {/* Recent Issues Table */}
            <div className="grid gap-4">
                <RecentIssuesTable issues={issues} projects={projects} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Issues Overview</CardTitle></CardHeader>
                    <CardContent>
                        <IssuesOverviewChartWithColors data={issueStats} />
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
