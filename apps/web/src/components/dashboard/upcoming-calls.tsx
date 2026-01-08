import { format, parseISO, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';
import { Calendar, Users, Clock, Video, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpcomingCallsProps {
    meetings: Array<{
        id: string;
        title: string;
        startTime: string;
        endTime: string;
        attendeeEmails: string[];
        sourceUrl?: string;
    }>;
}

export function UpcomingCalls({ meetings }: UpcomingCallsProps) {
    const now = new Date();

    // Filter to upcoming meetings only and sort by start time
    const upcomingMeetings = meetings
        .filter(m => new Date(m.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 3); // Show next 3 meetings

    if (upcomingMeetings.length === 0) {
        return (
            <div className="py-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming meetings scheduled</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                    Your calendar is clear for now
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
        </div>
    );
}

function MeetingCard({ meeting }: { meeting: UpcomingCallsProps['meetings'][0] }) {
    const startTime = parseISO(meeting.startTime);
    const endTime = parseISO(meeting.endTime);
    const now = new Date();

    // Calculate time until meeting
    const minutesUntil = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
    const hoursUntil = Math.floor(minutesUntil / 60);

    // Determine urgency
    const isUrgent = minutesUntil <= 15;
    const isSoon = minutesUntil <= 60;

    // Get relative date
    const getRelativeDate = () => {
        if (isToday(startTime)) return 'Today';
        if (isTomorrow(startTime)) return 'Tomorrow';
        return format(startTime, 'MMM d');
    };

    // Get time until display
    const getTimeUntil = () => {
        if (minutesUntil < 1) return 'Starting now';
        if (minutesUntil < 60) return `in ${minutesUntil}m`;
        if (hoursUntil < 24) return `in ${hoursUntil}h`;
        return formatDistanceToNow(startTime, { addSuffix: true });
    };

    // Calculate duration
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    return (
        <div
            className={cn(
                "p-4 rounded-lg border transition-all hover:shadow-sm",
                isUrgent
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                    : isSoon
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
                        : "bg-card hover:border-blue-400"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "mt-1 p-2 rounded-lg",
                    isUrgent
                        ? "bg-red-100 dark:bg-red-900/30"
                        : isSoon
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                )}>
                    <Video className={cn(
                        "w-4 h-4",
                        isUrgent
                            ? "text-red-600 dark:text-red-400"
                            : isSoon
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-blue-600 dark:text-blue-400"
                    )} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                            {meeting.title}
                        </h4>
                        {meeting.sourceUrl && (
                            <a
                                href={meeting.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>

                    <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">{getRelativeDate()}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{format(startTime, 'h:mm a')}</span>
                            <span className="text-muted-foreground/60">({durationMinutes}m)</span>
                        </div>

                        {meeting.attendeeEmails.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                <span>{meeting.attendeeEmails.length} {meeting.attendeeEmails.length === 1 ? 'attendee' : 'attendees'}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-2">
                        <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            isUrgent
                                ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                                : isSoon
                                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                        )}>
                            {getTimeUntil()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
