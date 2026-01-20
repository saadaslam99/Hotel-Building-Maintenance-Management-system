'use client';

import { useEffect, useState, useRef } from 'react';
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
import { Loader2, Mic, Trash2 } from 'lucide-react';

const formSchema = z.object({
    projectId: z.string().min(1),
    locationType: z.enum(['UNIT', 'OTHER']),
    unitId: z.string().optional(),
    otherArea: z.string().optional(),
    otherAreaDetails: z.string().optional(), // New field for "Other" details
    issueCausedBy: z.string().min(1, 'Please specify cause'),
    otherIssueCauseDescription: z.string().optional(),
    complaintType: z.string().min(1, 'Please select type'),
    otherComplaintType: z.string().optional(),
    description: z.string(), // Removed .min(5) here, validation moved to superRefine
    attachmentUrl: z.array(z.string()).min(1, 'At least one photo required').max(3, 'Max 3 files allowed'),
}).superRefine((data, ctx) => {
    // Other Cause Validation
    if (data.issueCausedBy === 'Other' && (!data.otherIssueCauseDescription || data.otherIssueCauseDescription.trim().length < 1)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify the cause.",
            path: ["otherIssueCauseDescription"],
        });
    }

    // Description validation: Need either text > 5 chars OR implicitly a voice note (which auto-fills text)

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
    const [recordingTime, setRecordingTime] = useState(0);

    // Refs for mutable instances to avoid stale closures in timeouts/callbacks
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectId: '',
            locationType: 'UNIT',
            unitId: '',
            otherArea: '',
            otherAreaDetails: '',
            issueCausedBy: '',
            otherIssueCauseDescription: '',
            complaintType: '',
            otherComplaintType: '',
            description: '',
            attachmentUrl: [],
        },
    });

    const locationType = form.watch('locationType');
    const complaintType = form.watch('complaintType');
    const selectedArea = form.watch('otherArea'); // Watching the dropdown value
    const description = form.watch('description');
    const issueCausedBy = form.watch('issueCausedBy'); // Watch cause to conditonally show other field

    // Reset other issue description if cause changes from Other
    useEffect(() => {
        if (issueCausedBy !== 'Other') {
            form.setValue('otherIssueCauseDescription', '');
        }
    }, [issueCausedBy, form]);


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
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
        };
    }, [audioUrl]);

    const stopRecording = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
        }
        setIsRecording(false);

        // Check ref for mocking state is tricky if we don't save it to ref, 
        // but we can trust the current render scope for 'isMocking' IF this function is called from UI.
        // BUT if called from timeout, 'isMocking' might be stale? 
        // Actually, 'isMocking' doesn't change during recording. So capture value is fine.
        // Wait, if I start (isMocking=false), then 30s later timeout calls this, isMocking is false. Correct.

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else if (isMocking) { // Fallback for mock which doesn't use mediaRecorderRef
            // Create dummy blob
            const blob = new Blob(['Mock audio content'], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            toast.info('Recording saved.');
        }
    };

    const startRecording = async () => {
        // Reset states
        setIsMocking(false);
        mediaRecorderRef.current = null;
        setAudioUrl(null); // Clear previous if any

        const runTimer = () => {
            setRecordingTime(0);
            const interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            timerIntervalRef.current = interval;

            // Auto-stop at exactly 30s (add slight buffer 30.5s to ensure UI shows 30)
            const timeout = setTimeout(() => {
                stopRecording();
                toast.info('Max recording limit (30s) reached.');
            }, 30500);
            stopTimeoutRef.current = timeout;
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
            mediaRecorderRef.current = recorder;
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

            // Handle Other Cause Description
            const finalOtherCauseDescription = values.issueCausedBy === 'Other'
                ? values.otherIssueCauseDescription
                : null; // Explicitly null if not 'Other'

            const newIssue = await api.issues.create({
                project_id: values.projectId,
                reported_by_user_id: user.id,
                location_type: values.locationType as LocationType,
                unit_id: values.unitId,
                other_area: finalArea, // Used computed area
                issue_caused_by: values.issueCausedBy,
                other_issue_cause_description: finalOtherCauseDescription, // New field
                complaint_type: finalComplaintType,
                description_text: values.description, // Validation handled by schema
                status: IssueStatus.OPEN,
                is_actionable: true,
                approved: false,
                verified: false,
                priority: IssuePriority.MEDIUM, // Default
                voice_url: audioUrl || undefined // Add voice URL if exists
            });

            // Add attachments
            // values.attachmentUrl is now an array of strings
            await Promise.all(values.attachmentUrl.map(async (url) => {
                await api.issues.addAttachment({
                    issue_id: newIssue.id,
                    url: url,
                    media_type: MediaType.IMAGE,
                    proof_type: ProofType.BEFORE
                });
            }));

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
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            const currentFiles = form.getValues('attachmentUrl') || [];

            if (currentFiles.length + newFiles.length > 3) {
                toast.error('Max 3 files allowed');
                return;
            }

            // Mock upload for each
            const newUrls = newFiles.map(file => `https://placehold.co/600x400/png?text=${encodeURIComponent(file.name)}`);
            form.setValue('attachmentUrl', [...currentFiles, ...newUrls], { shouldValidate: true });
            toast.info(`${newFiles.length} photo(s) uploaded`);
        }
        // Reset input
        e.target.value = '';
    };

    const removeAttachment = (indexToRemove: number) => {
        const currentFiles = form.getValues('attachmentUrl');
        const newFiles = currentFiles.filter((_, index) => index !== indexToRemove);
        form.setValue('attachmentUrl', newFiles, { shouldValidate: true });
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
                            <div className="grid grid-cols-2 gap-4">
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
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {issueCausedBy === 'Other' && (
                                    <FormField
                                        control={form.control}
                                        name="otherIssueCauseDescription"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Specify Cause</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Explain the cause..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

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
                                                variant="secondary"
                                                size="sm"
                                                onClick={startRecording} // Re-record (Replace)
                                            >
                                                Replace
                                            </Button>
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
                                        <FormLabel>Photo Evidence (Max 3)</FormLabel>
                                        <div className="space-y-4">
                                            <div className="flex gap-4 flex-wrap">
                                                {field.value.map((url, index) => (
                                                    <div key={index} className="h-20 w-20 bg-slate-200 rounded overflow-hidden flex-shrink-0 relative group">
                                                        <Image
                                                            src={url}
                                                            alt={`Evindence ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(index)}
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl opacity-75 hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {field.value.length < 3 && (
                                                    <div className="h-20 w-20 border-2 border-dashed border-slate-300 rounded flex items-center justify-center relative cursor-pointer hover:bg-slate-50">
                                                        <span className="text-xs text-slate-500 font-medium">+ Add</span>
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={handleFileUpload}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </div>
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
