import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    icon?: React.ElementType;
}

export function PageHeader({ title, description, children, className, icon: Icon }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b mb-6", className)}>
            <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    {Icon && <Icon className="h-6 w-6 text-muted-foreground/70" />}
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
