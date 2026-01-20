'use client';

import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Client } from '@/mock/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Building, User } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function OccupantsTable() {
    const [occupants, setOccupants] = useState<(Client & { unit_no: string, project_name: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        api.occupants.getAllActive().then(data => {
            setOccupants(data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const filtered = occupants.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.id_passport.toLowerCase().includes(search.toLowerCase()) ||
        o.project_name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <Skeleton className="h-64 w-full" />;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle>Active Occupants</CardTitle>
                    <CardDescription>
                        Currently occupied units and resident details.
                    </CardDescription>
                </div>
                <div className="w-[250px] relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search occupants..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Occupant Name</TableHead>
                            <TableHead>ID / Passport</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Phone</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No occupants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((occupant) => (
                                <TableRow key={occupant.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {occupant.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{occupant.id_passport}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <Building className="h-3 w-3 text-muted-foreground" />
                                            {occupant.project_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{occupant.unit_no}</TableCell>
                                    <TableCell>{occupant.phone || '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
