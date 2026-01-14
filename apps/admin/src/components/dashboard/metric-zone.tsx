import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricZoneProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    icon?: LucideIcon;
}

export function MetricZone({ title, description, children, className, icon: Icon }: MetricZoneProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-2 border-b pb-2">
                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {children}
            </div>
        </div>
    );
}
