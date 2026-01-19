'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue, IssueStatus, IssuePriority } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBarChart, PriorityPieChart } from '@/components/manager/charts';
import { Briefcase, AlertCircle, CheckCircle2, Users } from 'lucide-react';


export default function ManagerOverview() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.issues.getAll();
                setIssues(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        );
    }

    // KPIs
    const totalActionable = issues.filter(i => i.is_actionable).length;
    const openIssues = issues.filter(i => i.status === IssueStatus.OPEN).length;
    const inProgress = issues.filter(i => i.status === IssueStatus.IN_PROGRESS).length;
    const verifyPending = issues.filter(i => i.status === IssueStatus.RESOLVED && !i.verified).length;

    // Chart Data
    const statusData = [
        { name: 'Open', value: openIssues },
        { name: 'In Progress', value: inProgress },
        { name: 'Resolved', value: issues.filter(i => i.status === IssueStatus.RESOLVED).length },
        { name: 'Rejected', value: issues.filter(i => i.status === IssueStatus.REJECTED).length },
    ];

    const priorityData = [
        { name: 'Low', value: issues.filter(i => i.priority === IssuePriority.LOW).length },
        { name: 'Medium', value: issues.filter(i => i.priority === IssuePriority.MEDIUM).length },
        { name: 'High', value: issues.filter(i => i.priority === IssuePriority.HIGH).length },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Manager Overview</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Actionable Items</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalActionable}</div>
                        <p className="text-xs text-muted-foreground">Require attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verify Pending</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{verifyPending}</div>
                        <p className="text-xs text-muted-foreground">Work completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openIssues}</div>
                        <p className="text-xs text-muted-foreground">New reports</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Users className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgress}</div>
                        <p className="text-xs text-muted-foreground">With vendors</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Issues by Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <StatusBarChart data={statusData} />
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Issues by Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PriorityPieChart data={priorityData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
