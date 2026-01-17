'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue, IssueStatus, Project } from '@/mock/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { IssueActionDrawer } from '@/components/manager/issue-action-drawer';
import { format } from 'date-fns';
import { ListTodo, Archive, Eye } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';

export default function AdminIssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchIssues = async () => {
        const [issuesData, projectsData] = await Promise.all([
            api.issues.getActive(),
            api.projects.getAll()
        ]);
        setIssues(issuesData);
        setProjects(projectsData);
        setLoading(false);
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const handleViewIssue = (issue: Issue) => {
        setSelectedIssue(issue);
        setDrawerOpen(true);
    };

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
    };

    if (loading) {
        return <Skeleton className="h-96" />;
    }

    const stats = {
        open: issues.filter(i => i.status === IssueStatus.OPEN).length,
        inProgress: issues.filter(i => i.status === IssueStatus.IN_PROGRESS).length,
        resolved: issues.filter(i => i.status === IssueStatus.RESOLVED && !i.verified).length,
    };

    return (
        <div className="space-y-6 container mx-auto p-6 max-w-7xl">
            <PageHeader
                title="Issues"
                description="Manage all active issues. Resolved & verified issues are in History."
                icon={ListTodo}
            >
                <Link href="/app/admin/history">
                    <Button variant="outline">
                        <Archive className="mr-2 h-4 w-4" />
                        View History
                    </Button>
                </Link>
            </PageHeader>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{issues.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-500">Open</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.open}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-500">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-500">Awaiting Verification</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.resolved}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Active Issues</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {issues.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                        No active issues. All issues have been resolved or rejected.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                issues.map((issue) => (
                                    <TableRow key={issue.id}>
                                        <TableCell className="font-mono text-xs">#{issue.id.slice(-4)}</TableCell>
                                        <TableCell className="font-medium">{getProjectName(issue.project_id)}</TableCell>
                                        <TableCell className="font-medium">{issue.complaint_type}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{issue.location_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={issue.priority || 'MEDIUM'} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={issue.status} icon />
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(issue.created_at), 'PP')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewIssue(issue)}>
                                                <Eye className="h-4 w-4 mr-1" />
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <IssueActionDrawer
                issue={selectedIssue}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onUpdate={fetchIssues}
            />
        </div>
    );
}
