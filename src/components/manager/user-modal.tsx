'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, UserRole } from '@/mock/types';
import { api } from '@/mock/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
    fullName: z.string().min(2, 'Name too short'),
    employeeId: z.string().min(2, 'ID too short'),
    phone: z.string().min(5, 'Phone required'),
    password: z.string().min(4, 'Password too short').optional().or(z.literal('')),
    role: z.enum(['WORKER', 'MANAGER', 'ADMIN']),
    active: z.boolean(),
});

interface UserModalProps {
    user: User | null;
    role: UserRole; // Default role to create if new
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function UserModal({ user, role, open, onOpenChange, onSuccess }: UserModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            employeeId: '',
            phone: '',
            password: '',
            role: role,
            active: true,
        },
    });

    useEffect(() => {
        if (user && open) {
            form.reset({
                fullName: user.full_name,
                employeeId: user.employee_id,
                phone: user.phone || '',
                password: user.password || '',
                role: user.role,
                active: user.active
            });
        } else if (open) {
            form.reset({
                fullName: '',
                employeeId: '',
                phone: '',
                password: '',
                role: role,
                active: true
            });
        }
    }, [user, open, role, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            if (user) {
                await api.users.update(user.id, {
                    full_name: values.fullName,
                    phone: values.phone,
                    active: values.active,
                    // employee_id usually immutable, but allowing for demo
                });
                toast.success('User updated');
            } else {
                await api.users.create({
                    full_name: values.fullName,
                    employee_id: values.employeeId,
                    phone: values.phone,
                    password: values.password || '1234',
                    role: values.role as UserRole,
                    active: values.active,
                });
                toast.success('User created');
            }
            onSuccess();
            onOpenChange(false);
        } catch (e: any) {
            toast.error('Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee ID</FormLabel>
                                    <FormControl><Input {...field} disabled={!!user} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {!user && (
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        onValueChange={(v) => field.onChange(v === 'true')}
                                        defaultValue={field.value ? 'true' : 'false'}
                                        value={field.value ? 'true' : 'false'}
                                    >
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="true">Active</SelectItem>
                                            <SelectItem value="false">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
