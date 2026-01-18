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
        <div className={cn("space-y-6 rounded-xl border bg-card/50 p-6 backdrop-blur-sm", className)}>
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                {Icon && (
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                )}
                <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {title}
                    </h2>
                    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {children}
            </div>
        </div>
    );
}
