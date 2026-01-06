
import { Decision } from '@/types/meeting';
import { Gavel, Clock } from 'lucide-react';

export function MeetingDecisions({ decisions }: { decisions: Decision[] }) {
    if (decisions.length === 0) {
        return (
            <div className="bg-muted/10 border border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground">
                No explicit decisions were detected in this meeting.
            </div>
        );
    }

    const formatTime = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Gavel className="w-4 h-4 text-zinc-500" />
                Decisions Made
            </h3>
            <div className="grid gap-3">
                {decisions.map((d) => (
                    <div key={d.id} className="group flex items-start gap-4 p-4 bg-card rounded-xl border hover:shadow-sm transition-all">
                        <div className="flex-1">
                            <p className="font-medium text-foreground">{d.text}</p>
                            {d.category && (
                                <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {d.category}
                                </span>
                            )}
                        </div>
                        {d.timestamp && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Clock className="w-3 h-3" />
                                {formatTime(d.timestamp)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
