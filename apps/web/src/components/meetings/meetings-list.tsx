
import Link from 'next/link';
import { Meeting, MeetingStatus } from '@/types/meeting';
import { format, formatDistanceToNow } from 'date-fns';
import { Video, Mic, Upload, Calendar, ChevronRight, CheckCircle2, Circle, Clock } from 'lucide-react';

interface MeetingsListProps {
    meetings: Meeting[];
    isCalendarConnected?: boolean;
}


function StatusBadge({ status }: { status: MeetingStatus }) {
    if (status === 'processed') {
        return <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Processed</span>;
    }
    if (status === 'needs-review') {
        return <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"><Circle className="w-3 h-3 fill-current" /> Review Needed</span>;
    }
    return <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20"><Clock className="w-3 h-3" /> New</span>;
}

function SourceIcon({ source }: { source: string }) {
    switch (source) {
        case 'Zoom': return <Video className="w-4 h-4 text-blue-500" />;
        case 'Google Meet': return <Video className="w-4 h-4 text-green-500" />;
        case 'Microsoft Teams': return <Video className="w-4 h-4 text-indigo-500" />;
        case 'Upload': return <Upload className="w-4 h-4 text-zinc-500" />;
        default: return <Mic className="w-4 h-4 text-zinc-500" />;
    }
}


export function MeetingsList({ meetings, isCalendarConnected = false }: MeetingsListProps) {
    if (meetings.length === 0) {
        if (!isCalendarConnected) {
            return (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed rounded-xl">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Mic className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connect your calendar</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-6">
                        Connect your calendar to automatically sync and analyze your meetings.
                    </p>
                    <Link href="/settings/integrations">
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                            Connect Calendar
                        </button>
                    </Link>
                </div>
            );
        }

        // Connected but no meetings
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/5 border-2 border-dashed rounded-xl">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                    Your calendar is connected, but no meetings were found for this period.
                    <br />
                    Try syncing manually or upload a recording.
                </p>
                <div className="flex gap-3">
                    {/* Sync button is in header, maybe guide user there or just show upload */}
                    {/* We can re-use the upload trigger if we pass it down, but keeping it simple for now */}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Tip: Click "Sync Transcripts" in top right
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {meetings.map((meeting) => (
                <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="group block"
                >
                    <div className="bg-card border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all flex items-center gap-6">
                        {/* Date Box */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-muted/30 rounded-lg border text-center">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                                {format(new Date(meeting.date), 'MMM')}
                            </span>
                            <span className="text-xl font-bold text-foreground leading-none">
                                {format(new Date(meeting.date), 'd')}
                            </span>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <StatusBadge status={meeting.status} />
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <SourceIcon source={meeting.source} />
                                    {meeting.source} • {meeting.durationMinutes} min
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground truncate">{meeting.title}</h3>
                            <div className="flex -space-x-2 mt-2.5">
                                {meeting.participants.slice(0, 4).map((p, i) => (
                                    <div
                                        key={i}
                                        className="w-6 h-6 rounded-full ring-2 ring-background bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-foreground overflow-hidden"
                                        title={p.name}
                                    >
                                        {p.avatar ? (
                                            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            p.name.charAt(0)
                                        )}
                                    </div>
                                ))}
                                {meeting.participants.length > 4 && (
                                    <div className="w-6 h-6 rounded-full ring-2 ring-background bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                                        +{meeting.participants.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
