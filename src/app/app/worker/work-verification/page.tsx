'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/mock/api';
import { Issue, IssueStatus } from '@/mock/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadProofModal } from '@/components/worker/upload-proof-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, MapPin, Calendar, Camera } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkVerificationPage() {
    const { user } = useAuthStore();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const fetchIssues = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const allIssues = await api.issues.getAll();
            // SHOW: Status RESOLVED + Not Verified + Reported by Me
            // Requirement: "Show issues that need worker AFTER upload: Only issues with status=RESOLVED AND verified=false AND reported_by_user_id=self"
            const verificationNeeded = allIssues.filter(i =>
                i.status === IssueStatus.RESOLVED &&
                i.verified === false &&
                i.reported_by_user_id === user.id
            );
            setIssues(verificationNeeded);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, [user]);

    const handleOpenUpload = (id: string) => {
        setSelectedIssueId(id);
        setUploadModalOpen(true);
    };

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight">Work Verification</h1>
                <p className="text-slate-500">Upload proof for resolved issues to complete verification.</p>
            </div>

            {issues.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg border border-dashed">
                    <CheckCircle className="mx-auto h-10 w-10 text-green-500 mb-2 opacity-50" />
                    <p className="text-muted-foreground">No pending verifications found.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {issues.map((issue) => (
                        <Card key={issue.id} className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge className="bg-green-500">{issue.status}</Badge>
                                    <span className="text-xs text-slate-400">
                                        {format(new Date(issue.updated_at), 'MMM d, p')}
                                    </span>
                                </div>
                                <CardTitle className="text-lg mt-2 line-clamp-1">{issue.complaint_type}</CardTitle>
                                <CardDescription className="line-clamp-2">{issue.description_text}</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 text-sm text-slate-600 space-y-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{issue.location_display}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Camera className="h-4 w-4" />
                                    <span>Before proof uploaded</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button className="w-full" onClick={() => handleOpenUpload(issue.id)}>
                                    Upload After Proof
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <UploadProofModal
                issueId={selectedIssueId}
                open={uploadModalOpen}
                onOpenChange={setUploadModalOpen}
                onSuccess={fetchIssues}
            />
        </div>
    );
}
