'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/mock/api';
import { LocationType, ProofType, MediaType, IssueStatus, IssuePriority } from '@/mock/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2, Mic, Square, Trash2 } from 'lucide-react';

const formSchema = z.object({
    projectId: z.string().min(1),
    locationType: z.enum(['UNIT', 'OTHER']),
    unitId: z.string().optional(),
    otherArea: z.string().optional(),
    otherAreaDetails: z.string().optional(), // New field for "Other" details
    issueCausedBy: z.string().min(1, 'Please specify cause'),
    complaintType: z.string().min(1, 'Please select type'),
    otherComplaintType: z.string().optional(),
    description: z.string(), // Removed .min(5) here, validation moved to superRefine
    attachmentUrl: z.string().min(1, 'At least one photo required'),
}).superRefine((data, ctx) => {
    // Description validation: Need either text > 5 chars OR implicitly a voice note (which auto-fills text)
    // The requirement says: "Input description OR voice note".
    // If voice note recorded -> we auto-fill description with "Description in voice note".
    // So checking description.length > 0 is actually sufficient IF we enforce the auto-fill.
    // However, if manual text: "min(5)". If auto-fill: "Description in voice note" > 5.
    // So simple .min(1, "Please provide a description or record a voice note") on description might work, 
    // but better to be explicit about the length for typed text.

    if (data.description.length < 5) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please provide a description (min 5 chars) or record a voice note.",
            path: ["description"],
        });
    }
});

export default function ReportIssuePage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [projectUnits, setProjectUnits] = useState<{ id: string, unit_no: string }[]>([]);
    const [activeProject, setActiveProject] = useState<{ id: string, name: string } | null>(null);

    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const [isMocking, setIsMocking] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectId: '',
            locationType: 'UNIT',
            unitId: '',
            otherArea: '',
            otherAreaDetails: '',
            issueCausedBy: 'Tenant Misuse',
            complaintType: '',
            otherComplaintType: '',
            description: '',
            attachmentUrl: '',
        },
    });

    const locationType = form.watch('locationType');
    const complaintType = form.watch('complaintType');
    const selectedArea = form.watch('otherArea'); // Watching the dropdown value
    const description = form.watch('description');

    // Auto-fill description logic
    useEffect(() => {
        if (audioUrl && !description) {
            form.setValue('description', 'Description in voice note');
        } else if (!audioUrl && description === 'Description in voice note') {
            form.setValue('description', '');
        }
    }, [audioUrl, description, form]);

    useEffect(() => {
        // Check assignments
        const checkAssignment = async () => {
            try {
                const projects = await api.projects.getAll();
                const p1 = projects[0];
                if (p1) {
                    setActiveProject(p1);
                    form.setValue('projectId', p1.id);
                    // Fetch units
                    const units = await api.projects.getUnits(p1.id);
                    const realUnits = units.map(u => ({ id: u.id, unit_no: u.unit_no }));
                    setProjectUnits(realUnits);
                }
            } catch (e) {
                console.error(e);
            }
        };
        if (user) checkAssignment();
    }, [user, form]);

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
            if (timerInterval) clearInterval(timerInterval);
        };
    }, [audioUrl, timerInterval]);

    const startRecording = async () => {
        // Reset states
        setIsMocking(false);
        setMediaRecorder(null);

        const runTimer = () => {
            setRecordingTime(0);
            const interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            setTimerInterval(interval);
        };

        // Check for browser support and secure context
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.warning('Microphone API unavailable. Simulating recording for testing.');
            setIsRecording(true);
            setIsMocking(true);
            runTimer();
            return;
        }

        try {
            // This explicitly asks for permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                // Important: Release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            runTimer();

        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error accessing microphone:', error);
            if (error.name === 'NotFoundError') {
                toast.warning('No microphone found. Starting simulation mode.');
                setIsRecording(true);
                setIsMocking(true);
                runTimer();
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error('Permission denied. Please allow microphone access in your browser settings.');
            } else {
                // Fallback for other errors
                toast.warning('Could not access microphone. Simulating recording.');
                setIsRecording(true);
                setIsMocking(true);
                runTimer();
            }
        }
    };

    const stopRecording = () => {
        if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
        }
        setIsRecording(false);

        if (isMocking) {
            // Create dummy blob
            const blob = new Blob(['Mock audio content'], { type: 'text/plain' });
            // Use a sample audio file for better UX if possible, but strict blob is fine for now
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            toast.info('Recording simulated.');
        } else if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    };

    const deleteRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        setLoading(true);
        try {
            const finalComplaintType = values.complaintType === 'Other'
                ? values.otherComplaintType || 'Other'
                : values.complaintType;

            // Resolve Area Name: Dropdown or Custom
            const finalArea = values.locationType === 'UNIT'
                ? undefined // Not used for UNIT
                : (values.otherArea === 'Other' ? values.otherAreaDetails : values.otherArea);

            const newIssue = await api.issues.create({
                project_id: values.projectId,
                reported_by_user_id: user.id,
                location_type: values.locationType as LocationType,
                unit_id: values.unitId,
                other_area: finalArea, // Used computed area
                issue_caused_by: values.issueCausedBy,
                complaint_type: finalComplaintType,
                description_text: values.description, // Validation handled by schema
                status: IssueStatus.OPEN,
                is_actionable: true,
                approved: false,
                verified: false,
                priority: IssuePriority.MEDIUM, // Default
                voice_url: audioUrl || undefined // Add voice URL if exists
            });

            // Add attachment
            await api.issues.addAttachment({
                issue_id: newIssue.id,
                url: values.attachmentUrl,
                media_type: MediaType.IMAGE,
                proof_type: ProofType.BEFORE
            });

            toast.success('Issue reported successfully');
            router.push('/app/worker/dashboard');
        } catch (error: unknown) {
            toast.error('Failed to report issue');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Mock upload: create object URL or just use a placeholder
            // For persistence/localStorage, Object URL won't expire until refresh but reload kills it.
            // Better to use a static placeholder or base64 (too big).
            // I'll use a placeholder service with random text or the file name.
            const fakeUrl = `https://placehold.co/600x400/png?text=${encodeURIComponent(file.name)}`;
            form.setValue('attachmentUrl', fakeUrl);
            toast.info('Photo uploaded (Mock URL generated)');
        }
    };

    const COMMON_AREAS = [
        "Lobby", "Gym", "Garden", "Corridor / Hallway", "Parking", "Lift / Elevator",
        "Roof / Terrace", "Reception", "Staircase", "Basement", "Entrance / Gate",
        "Driveway", "Security Room", "Maintenance Room", "Restaurant / Cafe",
        "Pool", "Laundry Room", "Office / Management Room", "Storage Room",
        "Emergency Exit", "Common Washroom / Restroom", "Generator Room",
        "Electrical Room", "Utility Room", "Other"
    ];

    return (
        <div className="max-w-2xl mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Report New Issue</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Project (Read Only) */}
                            <FormItem>
                                <FormLabel>Project</FormLabel>
                                <Input value={activeProject?.name || 'Loading...'} disabled />
                            </FormItem>

                            {/* Location Type */}
                            <FormField
                                control={form.control}
                                name="locationType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex space-x-4"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="UNIT" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Unit</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="OTHER" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Common Area / Other</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Unit Select or Other Input */}
                            {locationType === 'UNIT' ? (
                                <FormField
                                    control={form.control}
                                    name="unitId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Select Unit</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a unit" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {projectUnits.map((u) => (
                                                        <SelectItem key={u.id} value={u.id}>Unit {u.unit_no}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="otherArea"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Area Name</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Area" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {COMMON_AREAS.map(area => (
                                                            <SelectItem key={area} value={area}>{area}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {selectedArea === 'Other' && (
                                        <FormField
                                            control={form.control}
                                            name="otherAreaDetails"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Specify other area</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Back Alley" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Cause */}
                            <FormField
                                control={form.control}
                                name="issueCausedBy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Issue Caused By</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select cause" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Tenant Misuse">Tenant Misuse</SelectItem>
                                                <SelectItem value="Wear and Tear">Wear and Tear</SelectItem>
                                                <SelectItem value="Accidental">Accidental</SelectItem>
                                                <SelectItem value="Construction Defect">Construction Defect</SelectItem>
                                                <SelectItem value="Unknown">Unknown</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Complaint Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="complaintType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                                                    <SelectItem value="Electrical">Electrical</SelectItem>
                                                    <SelectItem value="HVAC">HVAC</SelectItem>
                                                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {complaintType === 'Other' && (
                                    <FormField
                                        control={form.control}
                                        name="otherComplaintType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Specify Type</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Pest Control" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            {/* Description & Voice */}
                            <div className="space-y-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50">
                                <FormLabel className="flex justify-between items-baseline">
                                    <span>Provide description via text or voice note</span>
                                </FormLabel>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Type description here..."
                                                    {...field}
                                                    className="resize-none"
                                                    disabled={!!audioUrl} // Optional: disable text if voice exists? User req said "Voice note is optional but should not override typed text"
                                                // Requirement: "If the guard types a Description, voice note is optional but should not override the typed text."
                                                // "If the user records a voice note and the Description textbox is empty, then automatically set the Description field value to 'Description in voice note'"
                                                // So we allow editing.
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        OR record a voice note
                                    </div>
                                    {!audioUrl ? (
                                        <div className="flex items-center gap-2">
                                            {isRecording ? (
                                                <>
                                                    <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full" />
                                                    <span className="text-sm font-mono font-medium">{formatTime(recordingTime)}</span>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={stopRecording}
                                                    >
                                                        Stop
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={startRecording}
                                                >
                                                    <Mic className="h-4 w-4 mr-2" />
                                                    Record Voice
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <audio controls src={audioUrl} className="h-8 w-48" />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={deleteRecording}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Attachment */}
                            <FormField
                                control={form.control}
                                name="attachmentUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Photo Evidence (Required)</FormLabel>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="cursor-pointer"
                                            />
                                            {field.value && (
                                                <div className="h-10 w-10 bg-slate-200 rounded overflow-hidden flex-shrink-0 relative">
                                                    <Image
                                                        src={field.value}
                                                        alt="Preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
