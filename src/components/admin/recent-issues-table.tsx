'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Issue, Project, IssueStatus, IssuePriority } from '@/mock/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface RecentIssuesTableProps {
    issues: Issue[];
    projects: Project[];
}

export function RecentIssuesTable({ issues, projects }: RecentIssuesTableProps) {
    // Sort by created_at desc and take top 5
    const recentIssues = [...issues]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
    };

    const getStatusBadge = (issue: Issue) => {
        if (issue.verified) {
            return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
        }
        switch (issue.status) {
            case IssueStatus.OPEN:
                return <Badge variant="destructive">Open</Badge>;
            case IssueStatus.IN_PROGRESS:
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>; // Mapped "Pending" to IN_PROGRESS as per plan
            case IssueStatus.RESOLVED:
                return <Badge className="bg-blue-500 hover:bg-blue-600">Resolved</Badge>;
            case IssueStatus.REJECTED:
                return <Badge variant="secondary">Rejected</Badge>;
            default:
                return <Badge variant="outline">{issue.status}</Badge>;
        }
    };

    const getPriorityLabel = (priority?: IssuePriority) => {
        if (!priority) return <span className="text-gray-400">-</span>;
        switch (priority) {
            case IssuePriority.HIGH:
            case IssuePriority.URGENT:
                return <span className="text-red-500 font-medium">{priority}</span>;
            case IssuePriority.MEDIUM:
                return <span className="text-yellow-600 font-medium">{priority}</span>;
            case IssuePriority.LOW:
                return <span className="text-green-600 font-medium">{priority}</span>;
            default:
                return priority;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Issues</CardTitle>
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
                                <TableCell>{getStatusBadge(issue)}</TableCell>
                                <TableCell>{getPriorityLabel(issue.priority)}</TableCell>
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
