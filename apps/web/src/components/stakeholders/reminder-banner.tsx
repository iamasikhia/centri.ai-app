
import { AlertCircle } from 'lucide-react';

interface ReminderBannerProps {
    overdueCount: number;
    dueSoonCount: number;
}

export function ReminderBanner({ overdueCount, dueSoonCount }: ReminderBannerProps) {
    if (overdueCount === 0 && dueSoonCount === 0) return null;

    const isUrgent = overdueCount > 0;
    const count = isUrgent ? overdueCount : dueSoonCount;
    const text = isUrgent
        ? `${count} stakeholder${count > 1 ? 's' : ''} overdue for follow-up`
        : `${count} stakeholder${count > 1 ? 's' : ''} due for follow-up soon`;

    return (
        <div className={`
             mb-6 p-4 rounded-xl flex items-center gap-3 border
             ${isUrgent
                ? 'bg-destructive/5 border-destructive/20 text-destructive'
                : 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
            }
        `}>
            <div className={`p-2 rounded-full ${isUrgent ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-sm">Action Required</h3>
                <p className="text-sm opacity-90">{text}</p>
            </div>
        </div>
    );
}
