'use client';

import { Issue, IssueAttachment, Project, Unit, ProofType, User } from '@/mock/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Loader2 } from 'lucide-react';

interface IssueDetailModalProps {
    issue: Issue | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function IssueDetailModal({ issue, open, onOpenChange }: IssueDetailModalProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [attachments, setAttachments] = useState<IssueAttachment[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (issue && open) {
            setLoading(true);
            Promise.all([
                api.projects.getById(issue.project_id),
                api.issues.getAttachments(issue.id)
            ]).then(([p, a]) => {
                setProject(p || null);
                setAttachments(a);
                setLoading(false);
            });
        }
    }, [issue, open]);

    if (!issue) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <DialogTitle className="text-xl">{issue.complaint_type}</DialogTitle>
                            <DialogDescription className="mt-1">
                                Reported on {format(new Date(issue.created_at), 'PPP p')}
                            </DialogDescription>
                        </div>
                        <Badge>{issue.status.replace('_', ' ')}</Badge>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                    </div>
                ) : (
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4 py-2">
                            {/* Location */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold text-muted-foreground">Project:</span>
                                    <div className="font-medium">{project?.name || 'Loading...'}</div>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground">Location:</span>
                                    <div className="font-medium">
                                        {issue.location_type === 'UNIT' ? `Unit ${issue.unit_id}` : issue.other_area}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold text-muted-foreground">Caused By:</span>
                                    <div>{issue.issue_caused_by}</div>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground">Assigned Vendor:</span>
                                    <div>{issue.assigned_vendor_name || '-'}</div>
                                </div>
                            </div>

                            <Separator />

                            {/* Description */}
                            <div>
                                <h4 className="font-semibold mb-1">Description</h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {issue.description_text || 'No description provided.'}
                                </p>
                                {issue.voice_url && (
                                    <div className="mt-2 text-xs text-blue-500 underline cursor-pointer">
                                        Play Voice Note (Mock)
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Attachments */}
                            <div>
                                <h4 className="font-semibold mb-2">Proof of Work</h4>
                                {/* Before */}
                                <div className="mb-2">
                                    <span className="text-xs font-semibold uppercase text-slate-500">Before</span>
                                    <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                                        {attachments.filter(a => a.proof_type === ProofType.BEFORE).map(a => (
                                            <div key={a.id} className="h-24 w-24 bg-slate-200 rounded-md flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${a.url})` }} />
                                        ))}
                                        {attachments.filter(a => a.proof_type === ProofType.BEFORE).length === 0 && <div className="text-sm text-slate-400 italic">No attachments</div>}
                                    </div>
                                </div>

                                {/* After */}
                                <div>
                                    <span className="text-xs font-semibold uppercase text-slate-500">After</span>
                                    <div className="flex gap-2 mt-1 overflow-x-auto pb-2">
                                        {attachments.filter(a => a.proof_type === ProofType.AFTER).map(a => (
                                            <div key={a.id} className="h-24 w-24 bg-slate-200 rounded-md flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${a.url})` }} />
                                        ))}
                                        {attachments.filter(a => a.proof_type === ProofType.AFTER).length === 0 && <div className="text-sm text-slate-400 italic">No attachments</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
