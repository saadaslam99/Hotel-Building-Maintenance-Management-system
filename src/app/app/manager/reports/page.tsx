'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { StatusBarChart, PriorityPieChart } from '@/components/manager/charts';
import { useEffect, useState } from 'react';
import { api } from '@/mock/api';
import { Issue, IssueStatus } from '@/mock/types';

export default function ReportsPage() {
    const [issues, setIssues] = useState<Issue[]>([]);

    useEffect(() => {
        api.issues.getAll().then(setIssues);
    }, []);

    const downloadCSV = () => {
        // Mock download
        const header = ['ID,Type,Location,Status,Priority,Date'];
        const rows = issues.map(i => `${i.id},${i.complaint_type},${i.location_display || i.location_type},${i.status},${i.priority},${i.created_at}`);
        const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "maintenance_report.csv");
        document.body.appendChild(link);
        link.click();
    };

    // Mock aggregates
    const statusData = [
        { name: 'Open', value: issues.filter(i => i.status === IssueStatus.OPEN).length },
        { name: 'Resolved', value: issues.filter(i => i.status === IssueStatus.RESOLVED).length },
        { name: 'Accepted', value: issues.filter(i => i.status === IssueStatus.IN_PROGRESS).length },
    ];

    const priorityData = [
        { name: 'Low', value: issues.filter(i => i.priority === 'LOW').length },
        { name: 'High', value: issues.filter(i => i.priority === 'HIGH').length },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">System Reports</h1>
                <Button onClick={downloadCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Issues by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatusBarChart data={statusData} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Issues by Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PriorityPieChart data={priorityData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
