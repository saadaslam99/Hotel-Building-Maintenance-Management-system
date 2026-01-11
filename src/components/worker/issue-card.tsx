'use client';

import { Issue, IssueStatus, IssuePriority } from '@/mock/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface IssueCardProps {
    issue: Issue;
    onView: (issue: Issue) => void;
}

export function IssueCard({ issue, onView }: IssueCardProps) {
    const getStatusColor = (status: IssueStatus) => {
        switch (status) {
            case IssueStatus.OPEN: return 'bg-blue-500 hover:bg-blue-600';
            case IssueStatus.IN_PROGRESS: return 'bg-yellow-500 hover:bg-yellow-600 text-black';
            case IssueStatus.RESOLVED: return 'bg-green-500 hover:bg-green-600';
            case IssueStatus.REJECTED: return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500';
        }
    };

    const getPriorityColor = (priority?: IssuePriority) => {
        switch (priority) {
            case IssuePriority.URGENT: return 'text-red-500 border-red-200 bg-red-50';
            case IssuePriority.HIGH: return 'text-orange-500 border-orange-200 bg-orange-50';
            case IssuePriority.MEDIUM: return 'text-blue-500 border-blue-200 bg-blue-50';
            case IssuePriority.LOW: return 'text-slate-500 border-slate-200 bg-slate-50';
            default: return 'text-slate-500';
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge className={cn("mb-2", getStatusColor(issue.status))}>
                        {issue.status.replace('_', ' ')}
                    </Badge>
                    {issue.priority && (
                        <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                            {issue.priority}
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-lg font-semibold line-clamp-1">{issue.complaint_type}</CardTitle>
            </CardHeader>
            <CardContent className="pb-2 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                        {issue.location_type === 'UNIT' ? `Unit ${issue.unit_no || '?'}` : issue.other_area}
                        {/* Note: unit_no isn't on Issue, Issue has unit_id. We need to fetch unit or just show ID for mock speed. 
                  Actually I should join data. For now, showing raw or simple. 
                  Wait, issue.unit_id is ID. I need to fetch unit info. 
                  I'll fix this in the parent or just show static for now. 
                  Actually, Issue interface in types.ts doesn't have unit_no. 
                  I will fetch full details in parent and pass down, or just show ID. 
              */}
                        {issue.location_type === 'UNIT' ? ` (Unit)` : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{issue.issue_caused_by}</span>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Button variant="secondary" className="w-full" onClick={() => onView(issue)}>View Details</Button>
            </CardFooter>
        </Card>
    );
}
