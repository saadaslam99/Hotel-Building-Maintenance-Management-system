'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/mock/api';
import { Issue, IssueStatus } from '@/mock/types';
import { IssueCard } from '@/components/worker/issue-card';
import { IssueDetailModal } from '@/components/worker/issue-detail-modal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function WorkerIssuesPage() {
    const { user } = useAuthStore();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    useEffect(() => {
        const fetchIssues = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const allIssues = await api.issues.getAll();
                const myIssues = allIssues.filter(i => i.reported_by_user_id === user.id);
                const sorted = myIssues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setIssues(sorted);
                setFilteredIssues(sorted);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, [user]);

    useEffect(() => {
        let res = issues;

        if (search) {
            const q = search.toLowerCase();
            res = res.filter(i =>
                i.complaint_type.toLowerCase().includes(q) ||
                i.description_text?.toLowerCase().includes(q) ||
                i.issue_caused_by.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'ALL') {
            res = res.filter(i => i.status === statusFilter);
        }

        setFilteredIssues(res);
    }, [search, statusFilter, issues]);

    const handleViewIssue = (issue: Issue) => {
        setSelectedIssue(issue);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">My Issues</h1>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search issues..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
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
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            ) : (
                <>
                    {filteredIssues.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg">
                            <p className="text-muted-foreground">No issues found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredIssues.map(issue => (
                                <IssueCard key={issue.id} issue={issue} onView={handleViewIssue} />
                            ))}
                        </div>
                    )}
                </>
            )}

            <IssueDetailModal issue={selectedIssue} open={modalOpen} onOpenChange={setModalOpen} />
        </div>
    );
}
