'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/mock/api';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, User, History as HistoryIcon, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Unit, ClientUnitAssignment } from '@/mock/types';

const occupantFormSchema = z.object({
    unitName: z.string().min(1, 'Unit name required'),
    isOccupied: z.boolean(),
    // Occupant details (required if isOccupied is true)
    fullName: z.string().optional(),
    idPassport: z.string().optional(),
    phone: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.isOccupied) {
        if (!data.fullName || data.fullName.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Name is required", path: ["fullName"] });
        }
        if (!data.idPassport || data.idPassport.length < 5) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid ID/Passport required", path: ["idPassport"] });
        }
        if (!data.phone || data.phone.length < 5) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phone number required", path: ["phone"] });
        }
    }
});

type UnitFormValues = z.infer<typeof occupantFormSchema>;

interface UnitDetailsDialogProps {
    unit?: Unit | null;
    projectId?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function UnitDetailsDialog({ unit, projectId, open, onOpenChange, onSuccess }: UnitDetailsDialogProps) {
    const { user: currentUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<(ClientUnitAssignment & { occupant_name: string })[]>([]);

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [foundOccupant, setFoundOccupant] = useState(false);
    const [originalOccupant, setOriginalOccupant] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const isCreateMode = !unit;

    const form = useForm<UnitFormValues>({
        resolver: zodResolver(occupantFormSchema),
        defaultValues: {
            unitName: '',
            isOccupied: false,
            fullName: '',
            idPassport: '',
            phone: '',
        },
    });

    // Reset form when unit changes
    useEffect(() => {
        if (open) {
            if (unit) {
                // Edit Mode
                form.reset({
                    unitName: unit.unit_no,
                    isOccupied: unit.is_occupied,
                    fullName: '',
                    idPassport: '',
                    phone: '',
                });

                if (unit.is_occupied && unit.current_occupant_id) {
                    api.units.getHistory(unit.id).then(setHistory);
                    api.occupants.getById(unit.current_occupant_id).then(occ => {
                        if (occ) {
                            setOriginalOccupant(occ);
                            form.setValue('fullName', occ.name);
                            form.setValue('idPassport', occ.id_passport);
                            form.setValue('phone', occ.phone || '');
                        }
                    });
                } else {
                    setHistory([]);
                    setOriginalOccupant(null);
                }
                setIsEditing(false);
            } else {
                // Create Mode
                form.reset({
                    unitName: '',
                    isOccupied: false,
                    fullName: '',
                    idPassport: '',
                    phone: '',
                });
                setHistory([]);
                setOriginalOccupant(null);
                setIsEditing(true); // Always edit in create mode
            }
            setFoundOccupant(false);
        }
    }, [unit, open, form]);

    // Search occupant by ID on blur
    const handleIdBlur = async () => {
        const idVal = form.getValues('idPassport');
        if (!idVal || idVal.length < 3) return;

        setIsSearching(true);
        try {
            const results = await api.occupants.search(idVal);
            const exactMatch = results.find(c => c.id_passport.toLowerCase() === idVal.toLowerCase());

            if (exactMatch) {
                form.setValue('fullName', exactMatch.name);
                form.setValue('phone', exactMatch.phone || '');
                setFoundOccupant(true);
                toast.success("Existing occupant found!");
            } else {
                setFoundOccupant(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const onSubmit = async (values: UnitFormValues) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            if (isCreateMode) {
                // CREATE NEW UNIT
                if (!projectId) throw new Error("Project ID missing");

                await api.projects.addUnit(
                    {
                        project_id: projectId,
                        unit_no: values.unitName,
                        is_occupied: values.isOccupied,
                        created_by_user_id: currentUser.id
                    },
                    values.isOccupied ? {
                        name: values.fullName!,
                        id_passport: values.idPassport!,
                        phone: values.phone!,
                        assigned_by_user_id: currentUser.id
                    } : undefined
                );
                toast.success('Unit added successfully');

            } else {
                // EDIT EXISTING UNIT
                if (!unit) return;

                // 1. Name update
                if (values.unitName !== unit.unit_no) {
                    await api.units.update(unit.id, { unit_no: values.unitName });
                }

                if (values.isOccupied !== unit.is_occupied || values.isOccupied) {
                    if (!values.isOccupied) {
                        // Vacating
                        if (unit.is_occupied) {
                            await api.units.updateStatus(unit.id, false);
                            toast.success('Unit marked as vacant');
                        }
                    } else {
                        // Occupying / Updating
                        // Check if ID changed -> New Occupant
                        const isIdChanged = originalOccupant && originalOccupant.id_passport !== values.idPassport;

                        if (isIdChanged || !originalOccupant) {
                            // NEW OCCUPANT or RE-OCCUPYING
                            await api.units.updateStatus(unit.id, true, {
                                name: values.fullName!,
                                id_passport: values.idPassport!,
                                phone: values.phone!,
                                assigned_by_user_id: currentUser.id
                            });
                            toast.success('New occupant assigned');
                        } else {
                            // SAME OCCUPANT - UPDATE DETAILS
                            await api.occupants.update(originalOccupant.id, {
                                name: values.fullName,
                                phone: values.phone
                            });
                            toast.success('Occupant details updated');
                        }
                    }
                } else {
                    if (values.unitName !== unit.unit_no) toast.success('Unit name updated');
                }
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error(isCreateMode ? 'Failed to create unit' : 'Failed to update unit');
        } finally {
            setLoading(false);
        }
    };

    // Allow render if in create mode OR if unit exists
    if (!isCreateMode && !unit) return null;

    const isOccupied = form.watch('isOccupied');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isCreateMode ? 'Add New Unit' : `Unit Details: ${unit?.unit_no}`}</DialogTitle>
                    <DialogDescription>
                        {isCreateMode ? 'Add a new unit to this project.' : 'Manage unit information and occupancy status.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Details & Occupancy</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 py-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                <FormField
                                    control={form.control}
                                    name="unitName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Occupancy Status</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            {isOccupied ? 'Occupied' : 'Vacant'}
                                        </div>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="isOccupied"
                                        render={({ field }) => (
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={(checked: boolean) => {
                                                        if (!checked && unit && unit.is_occupied) {
                                                            if (confirm("Are you sure you want to mark this unit as VACANT? This will end the current occupancy.")) {
                                                                field.onChange(checked);
                                                            }
                                                        } else {
                                                            field.onChange(checked);
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                        )}
                                    />
                                </div>

                                {isOccupied && (
                                    <div className="space-y-4 border-t pt-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Occupant Details
                                            </h4>
                                            {!isCreateMode && unit?.is_occupied && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsEditing(!isEditing)}
                                                >
                                                    {isEditing ? <X className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
                                                    {isEditing ? 'Cancel' : 'Edit'}
                                                </Button>
                                            )}
                                        </div>

                                        {!isEditing && unit?.is_occupied && originalOccupant ? (
                                            <div className="space-y-3 bg-muted/30 p-3 rounded-lg border">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground block text-xs">Full Name</span>
                                                        <span className="font-medium">{originalOccupant.name}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block text-xs">ID / Passport</span>
                                                        <span className="font-medium">{originalOccupant.id_passport}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-muted-foreground block text-xs">Phone</span>
                                                        <span className="font-medium">{originalOccupant.phone || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="idPassport"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Qatar ID / Passport</FormLabel>
                                                            <div className="relative">
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        onBlur={() => {
                                                                            field.onBlur();
                                                                            handleIdBlur();
                                                                        }}
                                                                        placeholder="Enter unique ID to search..."
                                                                    />
                                                                </FormControl>
                                                                {isSearching && (
                                                                    <div className="absolute right-3 top-2.5">
                                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {foundOccupant && <p className="text-xs text-green-500 mt-1">Found existing occupant</p>}
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="fullName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Full Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Phone Number</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="+974..." />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="space-y-4 py-4">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <HistoryIcon className="h-4 w-4" />
                                Occupancy History
                            </h4>
                            {history.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No history records found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {history.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-md text-sm">
                                            <div>
                                                <div className="font-medium">{item.occupant_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(item.start_date), 'PP')} - {item.end_date ? format(new Date(item.end_date), 'PP') : 'Present'}
                                                </div>
                                            </div>
                                            <div className="text-xs px-2 py-1 rounded bg-muted">
                                                {item.is_active ? 'Active' : 'Past'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
