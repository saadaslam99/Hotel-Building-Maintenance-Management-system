'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Issue, IssuePriority, IssueStatus } from '@/mock/types';
import { api } from '@/mock/api';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminOverrideModalProps {
    issue: Issue;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AdminOverrideModal({ issue, open, onOpenChange, onSuccess }: AdminOverrideModalProps) {
    const { user } = useAuthStore();
    const [status, setStatus] = useState<IssueStatus>(issue.status);
    const [priority, setPriority] = useState<IssuePriority>(issue.priority || IssuePriority.MEDIUM);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleOverride = async () => {
        if (!user) return;

        // Simple validation: Ensure something changed
        if (status === issue.status && priority === issue.priority) {
            toast.error("No changes detected. Update status or priority to override.");
            return;
        }

        try {
            setLoading(true);
            await api.issues.adminOverride(issue.id, user.id, {
                status,
                priority,
                comment: comment || undefined
            });
            toast.success("Issue overridden successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Override failed", error);
            toast.error("Failed to override issue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Admin Override</DialogTitle>
                    <DialogDescription>
                        Manually force status or priority changes. This action will be logged.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(val) => setStatus(val as IssueStatus)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(IssueStatus).map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={(val) => setPriority(val as IssuePriority)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(IssuePriority).map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Reason / Comment (Optional)</Label>
                        <Textarea
                            placeholder="Why are you overriding this?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleOverride} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Apply Override
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
