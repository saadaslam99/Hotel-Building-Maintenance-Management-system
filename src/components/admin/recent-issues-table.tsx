'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Issue, Project } from '@/mock/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface RecentIssuesTableProps {
    issues: Issue[];
    projects: Project[];
}

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function RecentIssuesTable({ issues, projects }: RecentIssuesTableProps) {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        // Simulate a short delay for visual feedback since router.refresh is async but doesn't return a promise
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Sort by created_at desc and take top 5
    const recentIssues = [...issues]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <CardTitle>Recent Issues</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Fetch Issues
                    </Button>
                </div>
                <Link href="/app/admin/issues" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                    View All Issues <ArrowRight className="h-4 w-4" />
                </Link>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Issue ID</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentIssues.map((issue) => (
                            <TableRow key={issue.id}>
                                <TableCell className="font-medium text-xs font-mono">{issue.id.substring(0, 8)}...</TableCell>

                                <TableCell>{getProjectName(issue.project_id)}</TableCell>
                                <TableCell>{issue.complaint_type}</TableCell>
                                <TableCell>
                                    <StatusBadge status={issue.status} />
                                </TableCell>
                                <TableCell>
                                    <StatusBadge status={issue.priority || 'MEDIUM'} />
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                    {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                                </TableCell>
                            </TableRow>
                        ))}
                        {recentIssues.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    No issues found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
