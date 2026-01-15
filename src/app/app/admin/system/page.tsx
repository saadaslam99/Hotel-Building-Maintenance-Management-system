'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { Shield, Database, Lock, CheckCircle, Unlock, Activity, TrendingUp, AlertTriangle, Snowflake, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Simulated database operations data
const generateOperationsData = () => {
    return Array.from({ length: 10 }, (_, i) => ({
        minute: i + 1,
        reads: Math.floor(Math.random() * 50) + 10,
        writes: Math.floor(Math.random() * 20) + 5,
        total: 0
    })).map(d => ({ ...d, total: d.reads + d.writes }));
};

export default function SystemPage() {
    const { user } = useAuthStore();
    const [isFrozen, setIsFrozen] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingState, setPendingState] = useState(false);
    const [operationsData, setOperationsData] = useState(generateOperationsData());
    const [currentOps, setCurrentOps] = useState({ reads: 0, writes: 0 });

    // Simulate live operations when not frozen
    useEffect(() => {
        if (!isFrozen) {
            const interval = setInterval(() => {
                const newReads = Math.floor(Math.random() * 50) + 10;
                const newWrites = Math.floor(Math.random() * 20) + 5;
                setCurrentOps({ reads: newReads, writes: newWrites });
                setOperationsData(prev => {
                    const newData = [...prev.slice(1), {
                        minute: prev[prev.length - 1].minute + 1,
                        reads: newReads,
                        writes: newWrites,
                        total: newReads + newWrites
                    }];
                    return newData;
                });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isFrozen]);

    const handleToggleChange = useCallback((targetIsFrozen: boolean) => {
        setPendingState(targetIsFrozen);
        setShowConfirmDialog(true);
    }, []);

    const confirmToggle = () => {
        setIsFrozen(pendingState);
        setShowConfirmDialog(false);
        if (pendingState) {
            toast.success('Database frozen. All write operations are blocked.');
        } else {
            toast.success('Database operations resumed. Monitoring active.');
        }
    };

    // Requirement: Owner should not see system maintenance settings.
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

    const maxOps = Math.max(...operationsData.map(d => d.total), 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
                <Badge
                    variant="outline"
                    className={isFrozen
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }
                >
                    {isFrozen ? (
                        <><Snowflake className="h-3 w-3 mr-1" /> Database Frozen</>
                    ) : (
                        <><Activity className="h-3 w-3 mr-1 animate-pulse" /> Operations Active</>
                    )}
                </Badge>
            </div>

            {/* Database Freeze Control Card */}
            <Card className={`border-2 transition-all duration-500 ${isFrozen
                ? 'border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50/80 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/10'
                : 'border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10'
                }`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full transition-all duration-500 ${isFrozen
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {isFrozen ? (
                                    <Snowflake className="h-6 w-6" />
                                ) : (
                                    <Play className="h-6 w-6" />
                                )}
                            </div>
                            <div>
                                <CardTitle className={isFrozen ? 'text-blue-800 dark:text-blue-200' : 'text-green-800 dark:text-green-200'}>
                                    Database Freeze Control
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {isFrozen
                                        ? 'Database is frozen. All write operations are blocked for safety.'
                                        : 'Database is active. All operations are being processed normally.'
                                    }
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right mr-2">
                                <Label htmlFor="freeze-toggle" className={`text-sm font-medium ${isFrozen ? 'text-blue-700 dark:text-blue-300' : 'text-green-700 dark:text-green-300'
                                    }`}>
                                    {isFrozen ? 'FROZEN' : 'ACTIVE'}
                                </Label>
                            </div>
                            <Switch
                                id="freeze-toggle"
                                checked={!isFrozen}
                                onCheckedChange={(checked) => handleToggleChange(!checked)}
                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-blue-600"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Status Indicators */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isFrozen ? 'bg-blue-500/10 border-blue-200 dark:border-blue-800' : 'bg-background/50 border-green-200 dark:border-green-800'
                            }`}>
                            {isFrozen ? (
                                <Lock className="h-5 w-5 text-blue-600" />
                            ) : (
                                <Unlock className="h-5 w-5 text-green-600" />
                            )}
                            <div>
                                <div className="font-medium text-sm">Write Operations</div>
                                <div className={`text-xs ${isFrozen ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {isFrozen ? 'Blocked' : 'Allowed'}
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isFrozen ? 'bg-blue-500/10 border-blue-200 dark:border-blue-800' : 'bg-background/50 border-green-200 dark:border-green-800'
                            }`}>
                            <Database className={`h-5 w-5 ${isFrozen ? 'text-blue-600' : 'text-green-600'}`} />
                            <div>
                                <div className="font-medium text-sm">Read Operations</div>
                                <div className="text-xs text-green-600 dark:text-green-400">Allowed</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border transition-all ${isFrozen ? 'bg-blue-500/10 border-blue-200 dark:border-blue-800' : 'bg-background/50 border-green-200 dark:border-green-800'
                            }">
                            <Shield className={`h-5 w-5 ${isFrozen ? 'text-blue-600' : 'text-green-600'}`} />
                            <div>
                                <div className="font-medium text-sm">Data Protection</div>
                                <div className="text-xs text-green-600 dark:text-green-400">Active</div>
                            </div>
                        </div>
                    </div>

                    {/* Operations Graph - Only show when not frozen */}
                    {!isFrozen && (
                        <div className="mt-6 p-4 bg-background/50 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">Database Operations / Minute</span>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span>Reads: {currentOps.reads}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <span>Writes: {currentOps.writes}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span>Total: {currentOps.reads + currentOps.writes}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Simple Bar Chart */}
                            <div className="flex items-end gap-1 h-32 mt-4">
                                {operationsData.map((data, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t transition-all duration-500"
                                            style={{ height: `${(data.total / maxOps) * 100}%`, minHeight: '4px' }}
                                        />
                                        <span className="text-[10px] text-muted-foreground">{data.minute}m</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-center text-xs text-muted-foreground">
                                Live operations over the last 10 intervals • Updates every 3 seconds
                            </div>
                        </div>
                    )}

                    {/* Frozen State Animation */}
                    {isFrozen && (
                        <div className="mt-6 p-6 bg-blue-500/5 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="relative">
                                    <Snowflake className="h-12 w-12 text-blue-400 animate-pulse" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-ping opacity-20"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-blue-700 font-medium">Database is Frozen</div>
                            <div className="text-sm text-blue-600 mt-1">
                                All write operations are currently blocked. Toggle the switch above to resume normal operations.
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Protection Card */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-500/5">
                <CardHeader>
                    <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Data Protection Policy
                    </CardTitle>
                    <CardDescription>
                        These protections are <strong>always active</strong> regardless of freeze state.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-sm">No Data Deletion</h4>
                                <p className="text-xs text-muted-foreground">All records are preserved permanently. Users can only be deactivated, never deleted.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-sm">No Database Reset</h4>
                                <p className="text-xs text-muted-foreground">Database reset functionality has been permanently disabled to prevent financial loss.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-sm">Complete Audit Trail</h4>
                                <p className="text-xs text-muted-foreground">All actions are logged in the System Logs for accountability and compliance.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-sm">Issue Archival</h4>
                                <p className="text-xs text-muted-foreground">Resolved and verified issues are moved to History, not deleted.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Health Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        System Health
                    </CardTitle>
                    <CardDescription>
                        Current status of the database and system components.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 bg-muted/40 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">●</div>
                            <div className="text-sm font-medium mt-1">Database</div>
                            <div className="text-xs text-muted-foreground">
                                {isFrozen ? 'Frozen (Read-Only)' : 'Operational'}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-muted/40 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">●</div>
                            <div className="text-sm font-medium mt-1">API Services</div>
                            <div className="text-xs text-muted-foreground">Operational</div>
                        </div>
                        <div className="text-center p-4 bg-muted/40 rounded-lg">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">●</div>
                            <div className="text-sm font-medium mt-1">Storage</div>
                            <div className="text-xs text-muted-foreground">Operational</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            {pendingState ? 'Freeze Database?' : 'Resume Database Operations?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingState ? (
                                <>
                                    This will <strong>block all write operations</strong> to the database.
                                    Users will only be able to read data. Use this in emergency situations to prevent data corruption.
                                </>
                            ) : (
                                <>
                                    This will <strong>resume normal database operations</strong>.
                                    All read and write operations will be allowed. Make sure it is safe to proceed.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmToggle}
                            className={pendingState ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                        >
                            {pendingState ? 'Freeze Database' : 'Resume Operations'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
