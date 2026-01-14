import { Card, CardContent } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface DataCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    trend?: number; // percent change
    trendLabel?: string;
    intent?: 'neutral' | 'good' | 'bad';
    className?: string;
}

export function DataCard({
    title,
    value,
    subValue,
    trend,
    trendLabel = "vs last period",
    intent = 'neutral',
    className
}: DataCardProps) {
    const isPositive = trend && trend > 0;
    const isNegative = trend && trend < 0;
    const isNeutral = !trend;

    // Determine color based on intent (e.g. churn up is bad)
    let trendColor = "text-muted-foreground";
    if (intent === 'good') {
        trendColor = isPositive ? "text-green-600" : (isNegative ? "text-red-600" : "text-muted-foreground");
    } else if (intent === 'bad') {
        trendColor = isPositive ? "text-red-600" : (isNegative ? "text-green-600" : "text-muted-foreground");
    }

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-4">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">
                            {typeof value === 'number' ? formatNumber(value) : value}
                        </span>
                        {subValue && <span className="text-sm text-muted-foreground">{subValue}</span>}
                    </div>

                    {(trend !== undefined) && (
                        <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                            {isPositive && <TrendingUp className="h-3 w-3" />}
                            {isNegative && <TrendingDown className="h-3 w-3" />}
                            {isNeutral && <Minus className="h-3 w-3" />}
                            <span>{Math.abs(trend)}% {trendLabel}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
