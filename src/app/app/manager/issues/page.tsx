'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue, IssueStatus, IssuePriority } from '@/mock/types';
import { IssueActionDrawer } from '@/components/manager/issue-action-drawer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2, Search, Filter } from 'lucide-react';

export default function ManagerIssuesPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const data = await api.issues.getAll();
            setIssues(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    useEffect(() => {
        let res = issues;

        if (search) {
            const q = search.toLowerCase();
            res = res.filter(i =>
                i.complaint_type.toLowerCase().includes(q) ||
                i.description_text?.toLowerCase().includes(q) ||
                i.issue_caused_by.toLowerCase().includes(q) ||
                i.location_type.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'ALL') {
            res = res.filter(i => i.status === statusFilter);
        }

        if (priorityFilter !== 'ALL') {
            res = res.filter(i => i.priority === priorityFilter);
        }

        setFilteredIssues(res);
    }, [search, statusFilter, priorityFilter, issues]);

    const handleRowClick = (issue: Issue) => {
        setSelectedIssue(issue);
        setDrawerOpen(true);
    };

    const getStatusColor = (status: IssueStatus) => {
        switch (status) {
            case IssueStatus.OPEN: return 'bg-blue-500';
            case IssueStatus.IN_PROGRESS: return 'bg-yellow-500 text-black';
            case IssueStatus.RESOLVED: return 'bg-green-500';
            case IssueStatus.REJECTED: return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Issue Management</h1>
                    <p className="text-slate-500">Track, approve, and verify maintenance requests.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchIssues}>Refresh</Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search issues..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value={IssueStatus.OPEN}>Open</SelectItem>
                            <SelectItem value={IssueStatus.IN_PROGRESS}>In Progress</SelectItem>
                            <SelectItem value={IssueStatus.RESOLVED}>Resolved</SelectItem>
                            <SelectItem value={IssueStatus.REJECTED}>Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Priorities</SelectItem>
                            <SelectItem value={IssuePriority.LOW}>Low</SelectItem>
                            <SelectItem value={IssuePriority.MEDIUM}>Medium</SelectItem>
                            <SelectItem value={IssuePriority.HIGH}>High</SelectItem>
                            <SelectItem value={IssuePriority.URGENT}>Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Reported By</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredIssues.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No issues found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredIssues.map((issue) => (
                                    <TableRow
                                        key={issue.id}
                                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                                        onClick={() => handleRowClick(issue)}
                                    >
                                        <TableCell className="font-medium">
                                            <div>{issue.complaint_type}</div>
                                            <div className="text-xs text-muted-foreground">{issue.issue_caused_by}</div>
                                        </TableCell>
                                        <TableCell>
                                            {issue.location_type === 'UNIT' ? `Unit ${issue.unit_id}` : issue.other_area}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(issue.status)}>{issue.status.replace('_', ' ')}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {issue.priority && <Badge variant="outline">{issue.priority}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            User {issue.reported_by_user_id}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(issue.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <IssueActionDrawer issue={selectedIssue} open={drawerOpen} onOpenChange={setDrawerOpen} onUpdate={fetchIssues} />
        </div>
    );
}
