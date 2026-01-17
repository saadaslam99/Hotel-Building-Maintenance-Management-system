import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, XCircle, type LucideIcon } from "lucide-react";

type StatusIntent = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
    status: string;
    intent?: StatusIntent;
    className?: string;
    icon?: boolean;
}

const INTENT_STYLES: Record<StatusIntent, string> = {
    success: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20",
    error: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20",
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
    neutral: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20",
};

const STATUS_MAP: Record<string, StatusIntent> = {
    // Issues
    'OPEN': 'warning',
    'IN_PROGRESS': 'info',
    'RESOLVED': 'success',
    'REJECTED': 'error',
    // Priority
    'LOW': 'neutral',
    'MEDIUM': 'info',
    'HIGH': 'warning',
    'URGENT': 'error',
    // General
    'Active': 'success',
    'Inactive': 'neutral',
};

const ICON_MAP: Record<string, LucideIcon> = {
    'OPEN': AlertCircle,
    'IN_PROGRESS': Clock,
    'RESOLVED': CheckCircle,
    'REJECTED': XCircle,
};

export function StatusBadge({ status, intent, className, icon = false }: StatusBadgeProps) {
    // Auto-detect intent if not provided
    const detectedIntent = intent || STATUS_MAP[status] || 'neutral';
    const styles = INTENT_STYLES[detectedIntent];
    const Icon = ICON_MAP[status];

    return (
        <Badge variant="outline" className={cn("capitalize font-normal", styles, className)}>
            {icon && Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
            {status.replace(/_/g, ' ').toLowerCase()}
        </Badge>
    );
}
