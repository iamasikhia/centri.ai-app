
import { StakeholderStatus } from '@/types/stakeholder';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface StakeholderStatusBadgeProps {
    status: StakeholderStatus;
}

export function StakeholderStatusBadge({ status }: StakeholderStatusBadgeProps) {
    const config = {
        'on-track': {
            label: 'On Track',
            icon: CheckCircle2,
            className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        },
        'due-soon': {
            label: 'Due Soon',
            icon: Clock,
            className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        },
        'overdue': {
            label: 'Overdue',
            icon: AlertCircle,
            className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        },
    };

    const { label, icon: Icon, className } = config[status];

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
            className
        )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
}
