'use client';

import { Issue, IssueStatus, IssuePriority, User, IssueAttachment, ProofType } from '@/mock/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { api } from '@/mock/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, ShieldCheck, FileImage } from 'lucide-react';

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

    useEffect(() => {
        if (issue && open) {
            // Reset form
            setPriority(issue.priority || 'MEDIUM');
            setVendor(issue.assigned_vendor_name || '');
            setNote('');

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
        } catch (e: any) {
            toast.error(e.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    const beforeProofs = attachments.filter(a => a.proof_type === ProofType.BEFORE);
    const afterProofs = attachments.filter(a => a.proof_type === ProofType.AFTER);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>Manage Issue #{issue.id.slice(-4)}</SheetTitle>
                    <SheetDescription>
                        Created {format(new Date(issue.created_at), 'PPP')} by User {issue.reported_by_user_id}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                    <div className="space-y-6">
                        {/* Details */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Badge variant="outline" className="uppercase">{issue.location_type}</Badge>
                                <Badge>{issue.status.replace('_', ' ')}</Badge>
                            </div>
                            <h3 className="font-semibold text-lg">{issue.complaint_type}</h3>
                            <p className="text-sm text-muted-foreground">{issue.description_text}</p>
                            <div className="text-sm text-slate-500">Caused by: {issue.issue_caused_by}</div>
                        </div>

                        <Separator />

                        {/* Attachments */}
                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <FileImage className="h-4 w-4" /> Proofs
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-semibold uppercase text-slate-500">Before</span>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        {beforeProofs.length ? beforeProofs.map(a => (
                                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block h-16 w-16 bg-slate-100 rounded bg-cover bg-center" style={{ backgroundImage: `url(${a.url})` }} />
                                        )) : <span className="text-xs italic text-slate-400">None</span>}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold uppercase text-slate-500">After</span>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                        {afterProofs.length ? afterProofs.map(a => (
                                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block h-16 w-16 bg-slate-100 rounded bg-cover bg-center" style={{ backgroundImage: `url(${a.url})` }} />
                                        )) : <span className="text-xs italic text-slate-400">None</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Actions Panel */}
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
                            <h4 className="font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Workflow Actions
                            </h4>

                            {issue.status === IssueStatus.OPEN && (
                                <div className="space-y-4">
                                    <div className="grid w-full gap-1.5">
                                        <Label>Assign Priority</Label>
                                        <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">Low</SelectItem>
                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                <SelectItem value="HIGH">High</SelectItem>
                                                <SelectItem value="URGENT">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid w-full gap-1.5">
                                        <Label>Assign Vendor</Label>
                                        <Input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Vendor Name..." />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => handleAction('APPROVE')} disabled={loading}>
                                            Approve & Assign
                                        </Button>
                                        <Button variant="destructive" className="flex-1" onClick={() => handleAction('REJECT')} disabled={loading}>
                                            Reject
                                        </Button>
                                    </div>
                                    <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Rejection reason (if rejecting)..." />
                                </div>
                            )}

                            {issue.status === IssueStatus.IN_PROGRESS && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">
                                        Work is in progress by <strong>{issue.assigned_vendor_name}</strong>.
                                    </p>
                                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleAction('RESOLVE')} disabled={loading}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
                                    </Button>
                                </div>
                            )}

                            {issue.status === IssueStatus.RESOLVED && !issue.verified && (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">
                                        Issue resolved. Has the user uploaded 'After' proof?
                                    </p>
                                    {!afterProofs.length && (
                                        <div className="text-xs text-orange-600 font-medium">Warning: No 'After' proof uploaded yet.</div>
                                    )}
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleAction('VERIFY')} disabled={loading || !afterProofs.length}>
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Verify Work
                                    </Button>
                                    {!afterProofs.length && <p className="text-xs text-muted-foreground">Verification requires 'After' proof.</p>}
                                </div>
                            )}

                            {(issue.status === IssueStatus.REJECTED || issue.verified) && (
                                <div className="text-sm text-center text-slate-500 italic">
                                    No further actions available.
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
