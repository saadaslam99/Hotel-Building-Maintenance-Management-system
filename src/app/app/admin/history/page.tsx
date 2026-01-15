'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue, IssueStatus } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Archive, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const IssueTable = ({ issues, emptyMessage, handleViewDetails }: { issues: Issue[], emptyMessage: string, handleViewDetails: (issue: Issue) => void }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">View</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {issues.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {emptyMessage}
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
                            {issue.status === IssueStatus.RESOLVED && issue.verified ? (
                                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolved & Verified
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Rejected
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(issue.created_at), 'PP')}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(issue)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))
            )}
        </TableBody>
    </Table>
);

export default function HistoryPage() {
    const [historyIssues, setHistoryIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    useEffect(() => {
        api.issues.getHistory().then((issues) => {
            setHistoryIssues(issues);
            setLoading(false);
        });
    }, []);

    const resolvedVerified = historyIssues.filter(i => i.status === IssueStatus.RESOLVED && i.verified);
    const rejected = historyIssues.filter(i => i.status === IssueStatus.REJECTED);

    const handleViewDetails = (issue: Issue) => {
        setSelectedIssue(issue);
        setDetailOpen(true);
    };

    if (loading) {
        return <Skeleton className="h-96" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Archive className="h-6 w-6" />
                        Issue History
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View-only archive of resolved/verified and rejected issues.
                    </p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                    {historyIssues.length} archived issues
                </Badge>
            </div>

            <Tabs defaultValue="resolved" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resolved" className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Resolved & Verified ({resolvedVerified.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejected ({rejected.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="resolved">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Resolved & Verified Issues</CardTitle>
                            <CardDescription>
                                Issues that have been successfully resolved and verified by management.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <IssueTable issues={resolvedVerified} emptyMessage="No resolved and verified issues yet." handleViewDetails={handleViewDetails} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rejected">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Rejected Issues</CardTitle>
                            <CardDescription>
                                Issues that were rejected during the review process.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <IssueTable issues={rejected} emptyMessage="No rejected issues." handleViewDetails={handleViewDetails} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Detail View Sheet */}
            <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
                <SheetContent className="w-[450px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Issue Details #{selectedIssue?.id.slice(-4)}</SheetTitle>
                        <SheetDescription>
                            Archived on {selectedIssue && format(new Date(selectedIssue.updated_at), 'PPP')}
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-150px)] mt-6">
                        {selectedIssue && (
                            <div className="space-y-6 pr-4">
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Badge variant="outline">{selectedIssue.location_type}</Badge>
                                        {selectedIssue.status === IssueStatus.RESOLVED && selectedIssue.verified ? (
                                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Resolved & Verified</Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-lg">{selectedIssue.complaint_type}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedIssue.description_text}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg border">
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase">Caused By</span>
                                        <div className="font-medium text-sm">{selectedIssue.issue_caused_by}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase">Priority</span>
                                        <div className="font-medium text-sm">{selectedIssue.priority || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase">Assigned Vendor</span>
                                        <div className="font-medium text-sm">{selectedIssue.assigned_vendor_name || '-'}</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground uppercase">Reporter</span>
                                        <div className="font-medium text-sm">User {selectedIssue.reported_by_user_id}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Timeline
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">Created</span>
                                            <span>{format(new Date(selectedIssue.created_at), 'PPp')}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b">
                                            <span className="text-muted-foreground">Last Updated</span>
                                            <span>{format(new Date(selectedIssue.updated_at), 'PPp')}</span>
                                        </div>
                                        {selectedIssue.verified_at && (
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">Verified At</span>
                                                <span>{format(new Date(selectedIssue.verified_at), 'PPp')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                                    <p className="text-sm text-amber-600 dark:text-amber-500">
                                        <strong>Note:</strong> This is a read-only view. Archived issues cannot be modified or deleted.
                                    </p>
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
}
