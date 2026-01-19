'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue, Project, IssueStats } from '@/mock/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { IssueActionDrawer } from '@/components/manager/issue-action-drawer';
import { format } from 'date-fns';
import { ListTodo, Archive, Eye, RefreshCw, FileText, AlertCircle, Hammer, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';

export default function AdminIssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [stats, setStats] = useState<IssueStats | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchIssues = async () => {
        const [issuesData, projectsData, statsData] = await Promise.all([
            api.issues.getActive(),
            api.projects.getAll(),
            api.issues.getStats()
        ]);
        setIssues(issuesData);
        setProjects(projectsData);
        setStats(statsData);
        setLoading(false);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchIssues();
        setIsRefreshing(false);
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

    if (loading || !stats) {
        return <Skeleton className="h-96" />;
    }

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
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Total Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Active Issues:</span>
                                <span className="font-bold">{stats.activeIssues}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Resolved & Verified:</span>
                                <span className="font-bold">{stats.resolvedAndVerifiedIssues}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Open
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">High Priority:</span>
                                <span className="font-bold">{stats.openByPriority.HIGH || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Medium Priority:</span>
                                <span className="font-bold">{stats.openByPriority.MEDIUM || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Low Priority:</span>
                                <span className="font-bold">{stats.openByPriority.LOW || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-500 flex items-center gap-2">
                            <Hammer className="h-4 w-4" />
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{stats.inProgressIssues}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-500 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Awaiting Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.awaitingVerificationIssues}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Active Issues</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Fetch Issues
                    </Button>
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
                                            <Badge variant="outline" className="text-xs">{issue.location_display}</Badge>
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
