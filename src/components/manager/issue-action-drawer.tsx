'use client';

import { Issue, IssueStatus, IssuePriority, IssueAttachment, ProofType, IssueDetails, UserRole, IssueAuditLog } from '@/mock/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { api } from '@/mock/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { CheckCircle, Clock, ShieldCheck, FileImage, Mic, AlertTriangle, History } from 'lucide-react';
import { AdminUploadModal } from '@/components/admin/admin-upload-modal';
import { AdminOverrideModal } from '@/components/admin/admin-override-modal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
    const [details, setDetails] = useState<IssueDetails | null>(null);
    const [auditLogs, setAuditLogs] = useState<IssueAuditLog[]>([]);

    // Form states
    const [priority, setPriority] = useState<IssuePriority | ''>('');
    const [vendor, setVendor] = useState('');
    const [notes, setNotes] = useState(''); // Unified notes state

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'VERIFY' | null>(null);

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [overrideModalOpen, setOverrideModalOpen] = useState(false);

    useEffect(() => {
        if (issue && open) {
            // Reset form
            setPriority(issue.priority || IssuePriority.MEDIUM);
            setVendor(issue.assigned_vendor_name || '');
            setNotes('');
            setActionType(null);

            // Fetch attachments and details
            api.issues.getAttachments(issue.id).then(setAttachments);
            api.issues.getById(issue.id).then((data) => {
                if (data) setDetails(data);
            });
            api.issues.getAuditLogs(issue.id).then(setAuditLogs);
        }
    }, [issue, open]);

    if (!issue) return null;

    const openDecisionDialog = (type: 'APPROVE' | 'REJECT') => {
        if (type === 'APPROVE' && !vendor) {
            toast.error('Vendor name is required before approving');
            return;
        }
        setActionType(type);
        setNotes(''); // Clear previous notes
        setDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!user || !actionType) return;

        setLoading(true);
        try {
            let updates: Partial<Issue> = {};

            if (actionType === 'APPROVE') {
                updates = {
                    status: IssueStatus.IN_PROGRESS,
                    priority: priority as IssuePriority,
                    assigned_vendor_name: vendor,
                    approved: true,
                    approved_by_user_id: user.id,
                    approved_at: new Date().toISOString(),
                    approval_note: notes // Save approval note
                };
            } else if (actionType === 'REJECT') {
                if (!notes.trim()) {
                    toast.error('Rejection reason is required');
                    setLoading(false);
                    return;
                }
                updates = {
                    status: IssueStatus.REJECTED,
                    is_actionable: false,
                    rejection_reason: notes // Save rejection reason
                };
            }

            await api.issues.update(issue.id, updates);
            toast.success(`Issue ${actionType.toLowerCase()}d successfully`);
            onUpdate();
            setDialogOpen(false);
            onOpenChange(false);
        } catch (err) {
            const error = err as Error;
            toast.error(error.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    // Direct actions (Resolve) don't need the modal
    const handleDirectAction = async (action: 'RESOLVE') => {
        if (!user) return;
        setLoading(true);
        try {
            let updates: Partial<Issue> = {};
            if (action === 'RESOLVE') {
                updates = { status: IssueStatus.RESOLVED };
            }
            await api.issues.update(issue.id, updates);
            toast.success(`Issue resolved successfully`);
            onUpdate();
            onOpenChange(false);
        } catch {
            toast.error('Action failed');
        } finally {
            setLoading(false);
        }
    }

    // Verify dialog handler
    const openVerifyDialog = () => {
        setActionType(null); // Ensure it's not approve/reject
        setNotes('');
        setDialogOpen(true); // Reuse dialog, but we manage content based on context or add specific verify state
        // Actually, reusing "actionType" might be confusing if we need it for 'VERIFY'.
        // Let's assume we use a new state or extend actionType/dialog logic.
        // Let's add 'VERIFY' to actionType locally if we change state type, or use a separate flag.
        // For simplicity, let's just use a separate Verify logic inside the dialog content check or use a standard approach.
        // Given existing code uses "actionType" for Approve/Reject, let's extend it.
        // Wait, "actionType" is typed as 'APPROVE' | 'REJECT' | null.
        // I should update that type definition.
        // But since I'm replacing big chunk, I can redefine hooks or logic.
        // Let's use a "verifyDialogOpen" state for clarity? No, let's just reuse dialog.
    };

    // We need to extend the actionType state to include VERIFY
    // Since I can't change the hook definition easily without replacing the whole component body or using "any", 
    // I will use a separate verify handler function that sets a specific state or just modify handling.
    // Let's try to set `actionType` differently or cast.
    // Actually, I can just replace the definition of actionType in the component if I replace the top part.
    // But I am replacing from line 52. The state is defined at line 50.
    // I will assume I can cast or I should have replaced lines 36-51 too?
    // Let's look at lines 36-50.
    // I will use `setVerifyDialogOpen` (new state) if I can, but I can't add new hooks easily in middle.
    // I will REPLACE the whole component body to be safe and clean.

    // ... wait, I am replacing from line 52 (useEffect) downwards. `actionType` is defined above.
    // I will just use a hack: `setActionType('VERIFY' as any)` and handle it in render.

    // Better: let's implement handleVerifyConfirm.

    const handleVerifyConfirm = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await api.issues.update(issue.id, {
                verified: true,
                verified_at: new Date().toISOString(),
                verified_by_user_id: user.id,
                is_actionable: false,
                verification_comment: notes
            });
            toast.success('Issue verified manually');
            onUpdate();
            setDialogOpen(false);
            onOpenChange(false);
        } catch {
            toast.error('Verification failed');
        } finally {
            setLoading(false);
        }
    };


    const beforeProofs = attachments.filter(a => a.proof_type === ProofType.BEFORE);
    const afterProofs = attachments.filter(a => a.proof_type === ProofType.AFTER);
    const verificationProofs = attachments.filter(a => a.proof_type === ProofType.VERIFICATION);

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
                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{issue.location_display}</Badge>
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap break-words">
                                    {issue.description_text}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg border text-sm">
                                <div className="min-w-0">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Assigned To</span>
                                    <div className="font-medium mt-0.5 truncate" title={issue.assigned_vendor_name || ''}>
                                        {issue.assigned_vendor_name || 'Unassigned'}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Caused By</span>
                                    <div className="font-medium mt-0.5 break-words">{issue.issue_caused_by}</div>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Priority</span>
                                    <div className="font-medium mt-0.5">
                                        {issue.priority ? (
                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{issue.priority}</Badge>
                                        ) : '-'}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Reporter</span>
                                    <div className="font-medium mt-0.5 truncate" title={details?.reported_by_name || issue.reported_by_user_id}>
                                        {details?.reported_by_name ? details.reported_by_name : `User ${issue.reported_by_user_id}`}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 min-w-0">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Project</span>
                                <div className="font-medium mt-0.5 truncate" title={details?.project_name}>
                                    {details ? details.project_name : <Skeleton className="h-4 w-32" />}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Approval Status</span>
                                <div className="font-medium mt-0.5 flex items-center gap-2">
                                    {details ? (
                                        <>
                                            {details.approved ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-green-600 dark:text-green-500 font-semibold flex items-center gap-1.5">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        Approved
                                                    </span>
                                                    {details.approved_by_name ? (
                                                        <span className="text-xs text-muted-foreground">by {details.approved_by_name}</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Manager unknown</span>
                                                    )}
                                                    {issue.approval_note && (
                                                        <div className="text-xs text-muted-foreground italic border-l-2 pl-2 mt-0.5">
                                                            &quot;{issue.approval_note}&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            ) : issue.status === IssueStatus.REJECTED ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-destructive font-semibold">Rejected</span>
                                                    {issue.rejection_reason && (
                                                        <div className="text-xs text-destructive/80 italic border-l-2 border-destructive/20 pl-2 mt-0.5">
                                                            &quot;{issue.rejection_reason}&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-amber-600 dark:text-amber-500 font-medium">Pending Approval</span>
                                            )}
                                        </>
                                    ) : (
                                        <Skeleton className="h-4 w-24" />
                                    )}
                                </div>
                            </div>
                            {/* Verification Status for VERIFIED issues */}
                            {issue.verified && (
                                <div className="col-span-2 mt-4 pt-4 border-t">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Verification Details
                                    </span>
                                    <div className="mt-2 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-emerald-600 dark:text-emerald-500 font-semibold">
                                                Verified by {details?.verified_by_name || 'Admin'}
                                            </span>
                                            {issue.verified_at && (
                                                <span className="text-xs text-muted-foreground">
                                                    on {format(new Date(issue.verified_at), 'PPP p')}
                                                </span>
                                            )}
                                            {issue.verification_comment && (
                                                <div className="mt-1 bg-muted/50 p-2 rounded-md italic text-muted-foreground border-l-2 border-emerald-500/30">
                                                    &quot;{issue.verification_comment}&quot;
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Voice Note */}
                    {issue.voice_url && (
                        <div className="space-y-2 mt-6">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Mic className="h-3.5 w-3.5" /> Voice Description
                            </Label>
                            <div className="bg-muted/40 border rounded-md p-2 flex items-center">
                                <audio controls src={issue.voice_url} className="w-full h-8 invert dark:invert-0" />
                            </div>
                        </div>
                    )}

                    <Separator className="my-6" />

                    {/* Attachments */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-muted-foreground" />
                            Proof of Work
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                            {/* BEFORE, AFTER, VERIFICATION sections */}
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
                            {/* Verification Proofs - Visible if RESOLVED or VERIFIED */}
                            {(issue.status === IssueStatus.RESOLVED || issue.verified) && (
                                <div className="space-y-2 col-span-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">VERIFICATION PROOF</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {verificationProofs.length ? verificationProofs.map(a => (
                                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
                                                className="aspect-square bg-muted rounded-lg border overflow-hidden relative group hover:ring-2 ring-emerald-500/40 transition-all">
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${a.url})` }} />
                                            </a>
                                        )) : (
                                            <div className="col-span-4 h-16 bg-muted/30 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground italic">
                                                No verification proofs yet
                                            </div>
                                        )}
                                    </div>
                                    {issue.status === IssueStatus.RESOLVED && !issue.verified && (
                                        <Button variant="outline" size="sm" className="w-full text-xs h-8 border-dashed" onClick={() => setUploadModalOpen(true)}>
                                            <FileImage className="mr-1.5 h-3.5 w-3.5" /> Upload Verification Proof
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-6 bg-muted/30 border-t mt-auto">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Workflow Actions
                    </h4>

                    {issue.status === IssueStatus.OPEN && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Priority</Label>
                                    <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                                        <SelectTrigger className="h-9 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Assign Vendor</Label>
                                    <Input className="h-9 bg-background" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Vendor Name" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button className="flex-1 bg-primary hover:bg-primary/90" size="sm" onClick={() => openDecisionDialog('APPROVE')} disabled={loading}>
                                    Approve & Assign
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openDecisionDialog('REJECT')} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                                    Reject
                                </Button>
                            </div>
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
                            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleDirectAction('RESOLVE')} disabled={loading}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                            </Button>
                        </div>
                    )}

                    {issue.status === IssueStatus.RESOLVED && !issue.verified && (
                        <div className="space-y-4">
                            {!afterProofs.length && !verificationProofs.length ? (
                                <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/20 text-sm flex gap-2">
                                    <div className="h-2 w-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>Waiting for <strong>After</strong> photos or <strong>Verification</strong> proof.</span>
                                </div>
                            ) : (
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 text-sm flex gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>Proof submitted. Ready for verification.</span>
                                </div>
                            )}

                            <Button className="w-full" onClick={() => {
                                setActionType('VERIFY'); // Type hack due to hard to replace state definition
                                setNotes('');
                                setDialogOpen(true);
                            }} disabled={loading || (!afterProofs.length && !verificationProofs.length)}>
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

                {/* Audit Log / Timeline */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <History className="h-4 w-4" /> Activity Log
                        </h4>
                        {user?.role === UserRole.ADMIN && (
                            <Button variant="outline" size="sm" className="h-7 text-xs border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700" onClick={() => setOverrideModalOpen(true)}>
                                <AlertTriangle className="mr-1 h-3 w-3" /> Admin Override
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {auditLogs.length > 0 ? auditLogs.map((log) => (
                            <div key={log.id} className="text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1 relative">
                                <span className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {log.action === 'OVERRIDE' ? 'Admin Override' : log.action}
                                    </span>
                                    {log.details.from_status && (
                                        <span className="text-xs text-muted-foreground">
                                            Status: {log.details.from_status} → {log.details.to_status}
                                        </span>
                                    )}
                                    {log.details.from_priority && (
                                        <span className="text-xs text-muted-foreground">
                                            Priority: {log.details.from_priority} → {log.details.to_priority}
                                        </span>
                                    )}
                                    {log.comment && (
                                        <span className="text-xs italic text-muted-foreground mt-0.5">&quot;{log.comment}&quot;</span>
                                    )}
                                    <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground uppercase">
                                        <span>{log.changed_by_name || 'System'}</span>
                                        <span>•</span>
                                        <span>{format(new Date(log.created_at), 'MMM d, p')}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-xs text-muted-foreground italic">No activity recorded yet.</div>
                        )}
                    </div>
                </div>
            </SheetContent>

            <AdminOverrideModal
                issue={issue}
                open={overrideModalOpen}
                onOpenChange={setOverrideModalOpen}
                onSuccess={() => {
                    onUpdate();
                    // Refresh local details
                    api.issues.getById(issue.id).then(d => d && setDetails(d));
                    api.issues.getAuditLogs(issue.id).then(setAuditLogs);
                }}
            />

            {/* Decision/Verify Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'VERIFY' ? 'Verify Issue Completion' :
                                actionType === 'APPROVE' ? 'Approve Issue' : 'Reject Issue'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'VERIFY'
                                ? 'Confirm that the work has been completed satisfactorily. You can add an optional comment.'
                                : actionType === 'APPROVE'
                                    ? 'Add an optional note for this approval. This will be visible in the issue history.'
                                    : 'Please provide a reason for rejecting this issue. This is required.'}
                            {details?.reported_by_name && (actionType !== 'VERIFY') && (
                                <span className="block mt-1 font-medium text-foreground/80">
                                    Reported by: {details.reported_by_name}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>
                                {actionType === 'VERIFY' ? 'Verification Comment (Optional)' :
                                    actionType === 'APPROVE' ? 'Approval Note (Optional)' : 'Rejection Reason'}
                            </Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={
                                    actionType === 'VERIFY' ? 'e.g., Verified visually on site.' :
                                        actionType === 'APPROVE' ? 'e.g., Assigned to preferred vendor.' : 'e.g., Not a valid maintenance request.'
                                }
                                className="min-h-[100px]"
                            />
                            <div className="text-xs text-muted-foreground text-right">
                                {notes.length}/500
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>Cancel</Button>
                        <Button
                            variant={actionType === 'REJECT' ? 'destructive' : 'default'}
                            onClick={actionType === 'VERIFY' ? handleVerifyConfirm : handleConfirmAction}
                            disabled={loading}
                        >
                            {loading && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                            {actionType === 'VERIFY' ? 'Confirm Verification' :
                                actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AdminUploadModal
                issueId={issue.id}
                open={uploadModalOpen}
                onOpenChange={setUploadModalOpen}
                onSuccess={() => api.issues.getAttachments(issue.id).then(setAttachments)}
            />
        </Sheet >
    );
}
