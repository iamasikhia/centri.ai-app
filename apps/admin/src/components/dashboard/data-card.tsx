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
        trendColor = isPositive ? "text-emerald-600/90" : (isNegative ? "text-red-600" : "text-muted-foreground");
    } else if (intent === 'bad') {
        trendColor = isPositive ? "text-red-600" : (isNegative ? "text-emerald-600/90" : "text-muted-foreground");
    }

    // Determine background gradient based on intent
    let bgGradient = "";
    let borderColor = "";
    if (intent === 'good') {
        bgGradient = "bg-gradient-to-br from-emerald-500/5 via-emerald-500/2 to-transparent";
        borderColor = "border-emerald-500/20";
    } else if (intent === 'bad') {
        bgGradient = "bg-gradient-to-br from-red-500/5 via-red-500/2 to-transparent";
        borderColor = "border-red-500/20";
    } else {
        bgGradient = "bg-gradient-to-br from-primary/5 via-primary/2 to-transparent";
        borderColor = "border-border";
    }

    return (
        <Card className={cn("overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]", borderColor, bgGradient, className)}>
            <CardContent className="p-5">
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {typeof value === 'number' ? formatNumber(value) : value}
                        </span>
                        {subValue && <span className="text-sm text-muted-foreground font-medium">{subValue}</span>}
                    </div>

                    {(trend !== undefined) && (
                        <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit", 
                            trendColor,
                            isPositive && intent === 'good' ? "bg-emerald-500/10" : "",
                            isNegative && intent === 'good' ? "bg-red-500/10" : "",
                            isPositive && intent === 'bad' ? "bg-red-500/10" : "",
                            isNegative && intent === 'bad' ? "bg-emerald-500/10" : ""
                        )}>
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
