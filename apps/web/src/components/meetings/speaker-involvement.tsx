'use client';

import { SpeakerInvolvement } from '@/types/meeting';
import { Users, MessageSquare, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeakerInvolvementProps {
    involvement: SpeakerInvolvement[];
    meetingDurationMinutes?: number;
}

export function SpeakerInvolvementCard({ involvement, meetingDurationMinutes }: SpeakerInvolvementProps) {
    if (!involvement || involvement.length === 0) {
        return null;
    }

    // Calculate total words for percentage calculation
    const totalWords = involvement.reduce((sum, s) => sum + s.wordCount, 0);
    const totalDuration = involvement.reduce((sum, s) => sum + s.durationSeconds, 0);
    const totalSpeaks = involvement.reduce((sum, s) => sum + s.speakCount, 0);

    // Find most active speaker
    const mostActive = involvement.reduce((max, s) => 
        s.wordCount > max.wordCount ? s : max, involvement[0]
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Speaker Involvement</h3>
            </div>

            <div className="grid gap-4">
                {involvement.map((speaker, index) => {
                    const wordPercentage = totalWords > 0 ? Math.round((speaker.wordCount / totalWords) * 100) : 0;
                    const speakPercentage = totalSpeaks > 0 ? Math.round((speaker.speakCount / totalSpeaks) * 100) : 0;
                    const durationPercentage = totalDuration > 0 ? Math.round((speaker.durationSeconds / totalDuration) * 100) : 0;
                    const isMostActive = speaker.name === mostActive.name;

                    return (
                        <div
                            key={speaker.name}
                            className={cn(
                                "p-4 rounded-xl border transition-all hover:shadow-sm",
                                isMostActive && "bg-primary/5 border-primary/30"
                            )}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                                        isMostActive 
                                            ? "bg-primary text-primary-foreground" 
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {speaker.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2">
                                            {speaker.name}
                                            {isMostActive && (
                                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                                                    Most Active
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            {wordPercentage}% of conversation
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MessageSquare className="w-3 h-3" />
                                        <span>Spoke</span>
                                    </div>
                                    <div className="text-lg font-bold">{speaker.speakCount}x</div>
                                    <div className="text-xs text-muted-foreground">
                                        {speakPercentage}% of turns
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Hash className="w-3 h-3" />
                                        <span>Words</span>
                                    </div>
                                    <div className="text-lg font-bold">{speaker.wordCount}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {wordPercentage}% of total
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>Duration</span>
                                    </div>
                                    <div className="text-lg font-bold">
                                        {speaker.durationSeconds > 0 
                                            ? `${Math.round(speaker.durationSeconds / 60)}m` 
                                            : '—'}
                                    </div>
                                    {speaker.durationSeconds > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            {durationPercentage}% of time
                                        </div>
                                    )}
                                </div>
                            </div>

                            {speaker.topics && speaker.topics.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                    <div className="flex flex-wrap gap-1.5">
                                        {speaker.topics.map((topic, i) => (
                                            <span
                                                key={i}
                                                className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {meetingDurationMinutes && (
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Total meeting duration: {meetingDurationMinutes} minutes
                </div>
            )}
        </div>
    );
}
