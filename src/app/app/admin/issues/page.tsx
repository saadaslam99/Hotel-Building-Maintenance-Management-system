'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue, IssueStatus, IssuePriority } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { IssueActionDrawer } from '@/components/manager/issue-action-drawer';
import { format } from 'date-fns';
import { ListTodo, Archive, Eye, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminIssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchIssues = async () => {
        const data = await api.issues.getActive();
        setIssues(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const handleViewIssue = (issue: Issue) => {
        setSelectedIssue(issue);
        setDrawerOpen(true);
    };

    const getPriorityBadge = (priority?: IssuePriority) => {
        const colors: Record<string, string> = {
            'LOW': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
            'MEDIUM': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            'HIGH': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
            'URGENT': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        };
        return priority ? colors[priority] || '' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    };

    const getStatusBadge = (status: IssueStatus) => {
        switch (status) {
            case IssueStatus.OPEN:
                return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"><AlertCircle className="h-3 w-3 mr-1" />Open</Badge>;
            case IssueStatus.IN_PROGRESS:
                return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
            case IssueStatus.RESOLVED:
                return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ListTodo className="h-6 w-6" />
                        Active Issues
                    </h1>
                    <p className="text-muted-foreground">
                        Manage all active issues. Resolved & verified issues are in History.
                    </p>
                </div>
                <Link href="/app/admin/history">
                    <Button variant="outline">
                        <Archive className="mr-2 h-4 w-4" />
                        View History
                    </Button>
                </Link>
            </div>

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
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                        No active issues. All issues have been resolved or rejected.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                issues.map((issue) => (
                                    <TableRow key={issue.id}>
                                        <TableCell className="font-mono text-xs">#{issue.id.slice(-4)}</TableCell>
                                        <TableCell className="font-medium">{issue.complaint_type}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{issue.location_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getPriorityBadge(issue.priority)}>
                                                {issue.priority || 'MEDIUM'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(issue.status)}</TableCell>
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
