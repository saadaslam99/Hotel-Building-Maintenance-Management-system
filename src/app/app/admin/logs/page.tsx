'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/mock/api';
import { SystemLog } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { FileText, Search, Activity, User, Database, AlertCircle } from 'lucide-react';

export default function LogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('ALL');

    useEffect(() => {
        api.logs.getAll().then((data) => {
            // Sort by most recent first (with null check)
            const sorted = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setLogs(sorted);
            setLoading(false);
        }).catch(() => {
            setLogs([]);
            setLoading(false);
        });
    }, []);

    const filteredLogs = useMemo(() => {
        let result = logs;

        if (actionFilter !== 'ALL') {
            result = result.filter(log => log.action === actionFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(log =>
                log.action.toLowerCase().includes(query) ||
                log.entity_type.toLowerCase().includes(query) ||
                log.details?.toLowerCase().includes(query) ||
                log.performed_by_user_id.toLowerCase().includes(query)
            );
        }

        return result;
    }, [logs, actionFilter, searchQuery]);

    const uniqueActions = useMemo(() => [...new Set(logs.map(log => log.action))], [logs]);

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-700 border-green-200',
            'UPDATE': 'bg-blue-100 text-blue-700 border-blue-200',
            'DEACTIVATE': 'bg-orange-100 text-orange-700 border-orange-200',
            'REACTIVATE': 'bg-teal-100 text-teal-700 border-teal-200',
            'APPROVE': 'bg-purple-100 text-purple-700 border-purple-200',
            'REJECT': 'bg-red-100 text-red-700 border-red-200',
            'VERIFY': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'LOGIN': 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return colors[action.toUpperCase()] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType.toLowerCase()) {
            case 'user': return <User className="h-4 w-4" />;
            case 'issue': return <AlertCircle className="h-4 w-4" />;
            case 'database': return <Database className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    if (loading) {
        return <Skeleton className="h-96" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        System Logs
                    </h1>
                    <p className="text-muted-foreground">
                        Complete audit trail of all system activities. Read-only.
                    </p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                    {logs.length} total entries
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>
                        All actions are automatically logged for accountability and compliance. Logs cannot be deleted or modified.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Actions</SelectItem>
                                {uniqueActions.map(action => (
                                    <SelectItem key={action} value={action}>{action}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>Entity ID</TableHead>
                                <TableHead>Performed By</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        {logs.length === 0
                                            ? 'No system logs yet. Actions will be recorded automatically.'
                                            : 'No logs match your search criteria.'
                                        }
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {format(new Date(log.created_at), 'PP p')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getActionBadge(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {getEntityIcon(log.entity_type)}
                                            <span className="capitalize">{log.entity_type}</span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                                        <TableCell>User {log.performed_by_user_id}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                            {log.details || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
