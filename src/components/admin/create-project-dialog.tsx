'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { api } from '@/mock/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const projectFormSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    addressLine: z.string().min(1, 'Address line is required'),
    numberOfUnits: z.number().min(1, 'At least one unit is required'),
    units: z.array(z.object({
        unit_no: z.string().min(1, 'Unit number required')
    })).min(1, 'At least one unit is required'),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
    const { user: currentUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            name: '',
            addressLine: '',
            numberOfUnits: 1,
            units: [{ unit_no: 'Unit 1' }],
        },
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: 'units',
    });

    const watchedNumberOfUnits = form.watch('numberOfUnits');

    // Sync units array with number input
    useEffect(() => {
        const count = watchedNumberOfUnits || 0;
        const currentUnits = form.getValues('units');

        if (count > currentUnits.length) {
            // Add new units
            const newUnits = [...currentUnits];
            for (let i = currentUnits.length; i < count; i++) {
                newUnits.push({ unit_no: `Unit ${i + 1}` });
            }
            replace(newUnits);
        } else if (count < currentUnits.length && count > 0) {
            // Remove extra units
            replace(currentUnits.slice(0, count));
        }
    }, [watchedNumberOfUnits, replace, form]);

    const onSubmit = async (values: ProjectFormValues) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // 1. Create Project
            const newProject = await api.projects.create({
                name: values.name,
                location: values.addressLine,
                created_by_user_id: currentUser.id,
            });

            // 2. Add Units
            await Promise.all(values.units.map(u =>
                api.projects.addUnit({
                    project_id: newProject.id,
                    unit_no: u.unit_no,
                    is_occupied: false,
                    created_by_user_id: currentUser.id,
                })
            ));

            toast.success('Project created successfully');
            form.reset({
                name: '',
                addressLine: '',
                numberOfUnits: 1,
                units: [{ unit_no: 'Unit 1' }],
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Add a new property to the system.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

                        {/* Project Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Project Details</h3>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Project Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Skyline Apartments" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="addressLine"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address Line</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123 Main St, City, Country" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Units */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Units</h3>

                            <FormField
                                control={form.control}
                                name="numberOfUnits"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Number of Units</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                {...field}
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/20">
                                {fields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`units.${index}.unit_no`}
                                        render={({ field }) => (
                                            <FormItem className="space-y-0">
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                            {form.formState.errors.units && (
                                <p className="text-sm text-destructive">{form.formState.errors.units.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Project
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
