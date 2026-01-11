'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { db } from '@/mock/db';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemPage() {
    const { user } = useAuthStore();

    const handleReset = () => {
        if (confirm('Are you sure you want to reset all data to default seeds? This cannot be undone.')) {
            db.reset();
            toast.success('System data reset successfully. Reloading...');
        }
    };

    // Requirement: Owner should not see system maintenance settings.
    // Mock check: Owner is ADMIN but we mock "isOwner" check. 
    // User name or ID check? 
    // User ID 'u4' is Owner. employee_id 'owner'.
    const isOwner = user?.employee_id === 'owner';

    if (isOwner) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
                <Card className="opacity-50 pointer-events-none">
                    <CardHeader>
                        <CardTitle>Restricted Access</CardTitle>
                        <CardDescription>System maintenance settings are managed by Administrators only.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>

            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                        Destructive actions that affect the entire system database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium">Reset Demo Data</h4>
                            <p className="text-sm text-slate-500">
                                Resets all users, projects, and issues to the initial seed state. Clears all changes.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleReset}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset Database
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
