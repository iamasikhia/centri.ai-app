
import { Sparkles } from 'lucide-react';

interface MeetingSummaryProps {
    summary: string;
    takeaways: string[];
}

export function MeetingSummary({ summary, takeaways }: MeetingSummaryProps) {
    return (
        <div className="space-y-6">
            {/* AI Summary */}
            <div className="relative bg-card rounded-xl border p-6 shadow-sm">
                <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-semibold text-primary flex items-center gap-1 border rounded-full shadow-sm">
                    <Sparkles className="w-3 h-3" /> AI Executive Summary
                </div>
                <p className="text-base leading-relaxed text-foreground/90">
                    {summary}
                </p>
            </div>

            {/* Key Takeaways */}
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Takeaways</h3>
                <ul className="space-y-2">
                    {takeaways.map((point, i) => (
                        <li key={i} className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg border border-transparent hover:border-border transition-colors">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                            <span className="text-sm text-foreground/90 font-medium">{point}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
