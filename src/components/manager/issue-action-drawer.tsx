'use client';

import { Issue, IssueStatus, IssuePriority, IssueAttachment, ProofType } from '@/mock/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { api } from '@/mock/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { CheckCircle, Clock, ShieldCheck, FileImage, Mic } from 'lucide-react';

interface IssueActionDrawerProps {
    issue: Issue | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function IssueActionDrawer({ issue, open, onOpenChange, onUpdate }: IssueActionDrawerProps) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState<IssueAttachment[]>([]);

    // Form states
    const [priority, setPriority] = useState<IssuePriority | ''>('');
    const [vendor, setVendor] = useState('');
    const [note, setNote] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    useEffect(() => {
        if (issue && open) {
            // Reset form
            setPriority(issue.priority || IssuePriority.MEDIUM);
            setVendor(issue.assigned_vendor_name || '');
            setNote('');
            setIsRejecting(false);

            // Fetch attachments
            api.issues.getAttachments(issue.id).then(setAttachments);
        }
    }, [issue, open]);

    if (!issue) return null;

    const handleAction = async (action: 'APPROVE' | 'REJECT' | 'RESOLVE' | 'VERIFY') => {
        if (!user) return;
        setLoading(true);
        try {
            let updates: Partial<Issue> = {};

            if (action === 'APPROVE') {
                if (!vendor) {
                    toast.error('Vendor name is required');
                    setLoading(false);
                    return;
                }
                updates = {
                    status: IssueStatus.IN_PROGRESS,
                    priority: priority as IssuePriority,
                    assigned_vendor_name: vendor,
                    approved: true,
                    approved_by_user_id: user.id
                };
            } else if (action === 'REJECT') {
                if (!note) {
                    toast.error('Rejection reason (note) is required');
                    setLoading(false);
                    return;
                }
                updates = {
                    status: IssueStatus.REJECTED,
                    is_actionable: false
                };
            } else if (action === 'RESOLVE') {
                updates = {
                    status: IssueStatus.RESOLVED
                };
            } else if (action === 'VERIFY') {
                updates = {
                    verified: true,
                    verified_at: new Date().toISOString(),
                    verified_by_user_id: user.id,
                    is_actionable: false // Done
                };
            }

            await api.issues.update(issue.id, updates);
            toast.success(`Issue ${action.toLowerCase()}d successfully`);
            onUpdate();
            onOpenChange(false);
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    const beforeProofs = attachments.filter(a => a.proof_type === ProofType.BEFORE);
    const afterProofs = attachments.filter(a => a.proof_type === ProofType.AFTER);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[450px] sm:w-[540px] flex flex-col p-0 gap-0">
                <SheetHeader className="pl-6 pr-12 py-4 border-b bg-muted/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <SheetTitle className="text-xl">Issue #{issue.id.slice(-4)}</SheetTitle>
                            <SheetDescription className="mt-1">
                                Reported {format(new Date(issue.created_at), 'PPP')}
                            </SheetDescription>
                        </div>
                        <Badge variant={
                            issue.status === IssueStatus.OPEN ? 'default' :
                                issue.status === IssueStatus.RESOLVED ? 'outline' :
                                    issue.status === IssueStatus.IN_PROGRESS ? 'secondary' : 'secondary'
                        } className={`capitalize px-3 py-1 ${issue.status === IssueStatus.RESOLVED && issue.verified ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :
                            issue.status === IssueStatus.RESOLVED ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20' :
                                issue.status === IssueStatus.IN_PROGRESS ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20' :
                                    issue.status === IssueStatus.REJECTED ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20' : ''
                            }`}>
                            {issue.status === IssueStatus.RESOLVED && issue.verified ? 'Resolved & Verified' : issue.status.replace('_', ' ')}
                        </Badge>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-6 min-h-0">
                    <div className="space-y-8">
                        {/* Primary Issue Info */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    {issue.complaint_type}
                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{issue.location_type}</Badge>
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                                    {issue.description_text}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg border text-sm">
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Assigned To</span>
                                    <div className="font-medium mt-0.5">{issue.assigned_vendor_name || 'Unassigned'}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Caused By</span>
                                    <div className="font-medium mt-0.5">{issue.issue_caused_by}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Priority</span>
                                    <div className="font-medium mt-0.5">
                                        {issue.priority ? (
                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{issue.priority}</Badge>
                                        ) : '-'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reporter</span>
                                    <div className="font-medium mt-0.5">User {issue.reported_by_user_id}</div>
                                </div>
                            </div>
                        </div>

                        {/* Voice Note */}
                        {issue.voice_url && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                                    <Mic className="h-3.5 w-3.5" /> Voice Description
                                </Label>
                                <div className="bg-muted/40 border rounded-md p-2 flex items-center">
                                    <audio controls src={issue.voice_url} className="w-full h-8 invert dark:invert-0" />
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Attachments */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <FileImage className="h-4 w-4 text-muted-foreground" />
                                Proof of Work
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">BEFORE</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {beforeProofs.length ? beforeProofs.map(a => (
                                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                                                className="aspect-square bg-muted rounded-lg border overflow-hidden relative group hover:ring-2 ring-primary/20 transition-all">
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${a.url})` }} />
                                            </a>
                                        )) : (
                                            <div className="col-span-2 h-20 bg-muted/30 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground italic">
                                                No photos uploaded
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AFTER</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {afterProofs.length ? afterProofs.map(a => (
                                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                                                className="aspect-square bg-muted rounded-lg border overflow-hidden relative group hover:ring-2 ring-primary/20 transition-all">
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${a.url})` }} />
                                            </a>
                                        )) : (
                                            <div className="col-span-2 h-20 bg-muted/30 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground italic">
                                                Waiting for completion...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-6 bg-muted/30 border-t mt-auto">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Workflow Actions
                    </h4>

                    {issue.status === IssueStatus.OPEN && (
                        <div className="space-y-4">
                            {!isRejecting ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Priority</Label>
                                            <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                                                <SelectTrigger className="h-9 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Low</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                                    <SelectItem value="HIGH">High</SelectItem>
                                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Assign Vendor</Label>
                                            <Input className="h-9 bg-background" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Vendor Name" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button className="flex-1 bg-primary hover:bg-primary/90" size="sm" onClick={() => handleAction('APPROVE')} disabled={loading}>
                                            Approve & Assign
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setIsRejecting(true)} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                                            Reject
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3 bg-destructive/5 p-3 rounded-md border border-destructive/20 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-destructive">Reason for Rejection</Label>
                                        <Button variant="ghost" size="sm" onClick={() => setIsRejecting(false)} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                                            Cancel
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Please provide a reason..."
                                        className="min-h-[80px] text-sm resize-none"
                                    />
                                    <Button variant="destructive" size="sm" className="w-full" onClick={() => handleAction('REJECT')} disabled={loading}>
                                        Confirm Rejection
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {issue.status === IssueStatus.IN_PROGRESS && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md border border-blue-500/20">
                                <Clock className="h-5 w-5 shrink-0" />
                                <div className="text-sm">
                                    Work in progress by <span className="font-semibold">{issue.assigned_vendor_name}</span>
                                </div>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleAction('RESOLVE')} disabled={loading}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                            </Button>
                        </div>
                    )}

                    {issue.status === IssueStatus.RESOLVED && !issue.verified && (
                        <div className="space-y-4">
                            {!afterProofs.length ? (
                                <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20 text-sm flex gap-2">
                                    <div className="h-2 w-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>Waiting for <strong>After</strong> photos to verify completion.</span>
                                </div>
                            ) : (
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 text-sm flex gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>Proof submitted. Ready for verification.</span>
                                </div>
                            )}

                            <Button className="w-full" onClick={() => handleAction('VERIFY')} disabled={loading || !afterProofs.length}>
                                <ShieldCheck className="mr-2 h-4 w-4" /> Verify & Close Issue
                            </Button>
                        </div>
                    )}

                    {(issue.status === IssueStatus.REJECTED || issue.verified) && (
                        <div className="text-center py-2">
                            <Badge variant="outline" className="text-muted-foreground font-normal">
                                {issue.status === IssueStatus.REJECTED ? 'Issue Rejected' : 'Verified & Closed'}
                            </Badge>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
