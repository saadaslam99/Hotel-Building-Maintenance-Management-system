'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { api } from '@/mock/api';
import { MediaType, ProofType } from '@/mock/types';
import { toast } from 'sonner';

interface AdminUploadModalProps {
    issueId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AdminUploadModal({ issueId, open, onOpenChange, onSuccess }: AdminUploadModalProps) {
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fakeUrl = `https://placehold.co/600x400/png?text=Verification-${encodeURIComponent(file.name)}`;
            setFileUrl(fakeUrl);
            toast.info('File selected (Mock URL generated)');
        }
    };

    const handleSubmit = async () => {
        if (!issueId || !fileUrl) return;
        setLoading(true);
        try {
            await api.issues.addAttachment({
                issue_id: issueId,
                url: fileUrl,
                media_type: MediaType.IMAGE,
                proof_type: ProofType.VERIFICATION
            });
            toast.success('Verification proof uploaded');
            setFileUrl('');
            onSuccess();
            onOpenChange(false);
        } catch (e) {
            toast.error('Failed to upload proof');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Verification Proof</DialogTitle>
                    <DialogDescription>
                        Upload a photo showing your verification of this issue (optional but recommended).
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="verification-picture">Proof Image</Label>
                        <Input id="verification-picture" type="file" onChange={handleFileUpload} />
                    </div>
                    {fileUrl && (
                        <div className="h-32 w-full bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                            <img src={fileUrl} alt="Preview" className="h-full w-auto object-cover" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !fileUrl}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
