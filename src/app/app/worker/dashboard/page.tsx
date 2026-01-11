'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/mock/api';
import { Issue, IssueStatus } from '@/mock/types';
import { IssueCard } from '@/components/worker/issue-card';
import { IssueDetailModal } from '@/components/worker/issue-detail-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function WorkerDashboard() {
    const { user } = useAuthStore();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const fetchIssues = async () => {
            if (!user) return;
            try {
                const allIssues = await api.issues.getAll();
                const myIssues = allIssues.filter(i => i.reported_by_user_id === user.id);
                setIssues(myIssues);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, [user]);

    const stats = {
        open: issues.filter(i => i.status === IssueStatus.OPEN).length,
        inProgress: issues.filter(i => i.status === IssueStatus.IN_PROGRESS).length,
        resolved: issues.filter(i => i.status === IssueStatus.RESOLVED).length,
    };

    const handleViewIssue = (issue: Issue) => {
        setSelectedIssue(issue);
        setModalOpen(true);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Worker Dashboard</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.open}</div>
                        <p className="text-xs text-muted-foreground">Reported by you</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inProgress}</div>
                        <p className="text-xs text-muted-foreground">With vendors</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resolved}</div>
                        <p className="text-xs text-muted-foreground">Verification pending</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Issues List */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>
                {issues.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No issues found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {issues.map(issue => (
                            <IssueCard key={issue.id} issue={issue} onView={handleViewIssue} />
                        ))}
                    </div>
                )}
            </div>

            <IssueDetailModal issue={selectedIssue} open={modalOpen} onOpenChange={setModalOpen} />
        </div>
    );
}
