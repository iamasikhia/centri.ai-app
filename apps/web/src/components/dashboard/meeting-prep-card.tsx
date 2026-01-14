'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Calendar, Clock, Users, AlertTriangle, CheckCircle2,
    ArrowRight, Sparkles, Video, MessageSquare, GitPullRequest,
    Target, Loader2, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { formatDistanceToNow, format, isToday, isTomorrow } from 'date-fns';

interface Meeting {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    participants: string[];
    summary?: string;
    platform?: string;
}

interface MeetingPrep {
    meeting: Meeting;
    briefing: {
        context: string;
        previousDecisions: string[];
        openActionItems: Array<{ item: string; owner: string; daysOld?: number }>;
        blockers: string[];
        suggestedTopics: string[];
        prepTimeMinutes: number;
        urgency: 'low' | 'medium' | 'high';
    };
}

export function MeetingPrepCard() {
    const [loading, setLoading] = useState(true);
    const [prep, setPrep] = useState<MeetingPrep | null>(null);
    const [generating, setGenerating] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchNextMeetingPrep();
    }, []);

    const fetchNextMeetingPrep = async () => {
        try {
            const res = await axios.get(`${API_URL}/meetings/next-prep`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.data && res.data.meeting) {
                setPrep(res.data);
            }
        } catch (e) {
            console.error('Failed to fetch meeting prep', e);
        } finally {
            setLoading(false);
        }
    };

    const generateBriefing = async () => {
        if (!prep?.meeting) return;
        setGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/meetings/${prep.meeting.id}/generate-briefing`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.data) {
                setPrep(prev => prev ? { ...prev, briefing: res.data } : null);
            }
        } catch (e) {
            console.error('Failed to generate briefing', e);
        } finally {
            setGenerating(false);
        }
    };

    const getTimeDisplay = (startTime: string) => {
        const date = new Date(startTime);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 0) {
            return { text: 'In progress', color: 'text-green-600', urgent: false };
        } else if (diffMins < 30) {
            return { text: `In ${diffMins} min`, color: 'text-red-600', urgent: true };
        } else if (diffMins < 60) {
            return { text: `In ${diffMins} min`, color: 'text-amber-600', urgent: false };
        } else if (isToday(date)) {
            return { text: `Today at ${format(date, 'h:mm a')}`, color: 'text-foreground', urgent: false };
        } else if (isTomorrow(date)) {
            return { text: `Tomorrow at ${format(date, 'h:mm a')}`, color: 'text-muted-foreground', urgent: false };
        } else {
            return { text: format(date, 'EEE, MMM d, h:mm a'), color: 'text-muted-foreground', urgent: false };
        }
    };

    if (loading) {
        return (
            <Card className="col-span-full lg:col-span-2">
                <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!prep?.meeting) {
        return (
            <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/30">
                <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">You're all caught up! 🎉</h3>
                    <p className="text-sm text-muted-foreground">No upcoming meetings to prep for.</p>
                </CardContent>
            </Card>
        );
    }

    const timeDisplay = getTimeDisplay(prep.meeting.startTime);
    const briefing = prep.briefing;

    return (
        <Card className={`col-span-full lg:col-span-2 overflow-hidden ${timeDisplay.urgent ? 'ring-2 ring-red-500/20' : ''}`}>
            {/* Header with urgency indicator */}
            <div className={`h-1 ${timeDisplay.urgent ? 'bg-red-500' : briefing?.urgency === 'high' ? 'bg-amber-500' : 'bg-primary'}`} />

            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Next Meeting Prep
                        </p>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Video className="w-5 h-5 text-primary" />
                            {prep.meeting.title}
                        </CardTitle>
                    </div>
                    <Badge variant={timeDisplay.urgent ? 'destructive' : 'secondary'} className="shrink-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {timeDisplay.text}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Participants */}
                <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {prep.meeting.participants?.slice(0, 3).join(', ')}
                        {prep.meeting.participants?.length > 3 && ` +${prep.meeting.participants.length - 3} more`}
                    </span>
                </div>

                {/* Briefing Content */}
                {briefing ? (
                    <div className="space-y-4">
                        {/* Quick Context */}
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm">{briefing.context}</p>
                        </div>

                        {/* Key Stats Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                <p className="text-2xl font-bold text-amber-600">{briefing.blockers?.length || 0}</p>
                                <p className="text-xs text-muted-foreground">Blockers</p>
                            </div>
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{briefing.openActionItems?.length || 0}</p>
                                <p className="text-xs text-muted-foreground">Open Items</p>
                            </div>
                            <div className="text-center p-2 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                                <p className="text-2xl font-bold text-violet-600">{briefing.prepTimeMinutes || 5}</p>
                                <p className="text-xs text-muted-foreground">Min to Prep</p>
                            </div>
                        </div>

                        {/* Expandable Details */}
                        {expanded && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                {/* Blockers */}
                                {briefing.blockers && briefing.blockers.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase text-amber-600 mb-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Blockers to Discuss
                                        </h4>
                                        <ul className="space-y-1">
                                            {briefing.blockers.map((blocker, i) => (
                                                <li key={i} className="text-sm flex items-start gap-2">
                                                    <span className="text-amber-500">•</span>
                                                    {blocker}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Open Action Items */}
                                {briefing.openActionItems && briefing.openActionItems.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase text-blue-600 mb-2 flex items-center gap-1">
                                            <Target className="w-3 h-3" />
                                            Open Action Items
                                        </h4>
                                        <ul className="space-y-1">
                                            {briefing.openActionItems.map((item, i) => (
                                                <li key={i} className="text-sm flex items-start justify-between gap-2">
                                                    <span className="flex items-start gap-2">
                                                        <span className="text-blue-500">•</span>
                                                        {item.item}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground shrink-0">
                                                        @{item.owner}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Previous Decisions */}
                                {briefing.previousDecisions && briefing.previousDecisions.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase text-green-600 mb-2 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Previous Decisions
                                        </h4>
                                        <ul className="space-y-1">
                                            {briefing.previousDecisions.map((decision, i) => (
                                                <li key={i} className="text-sm flex items-start gap-2">
                                                    <span className="text-green-500">✓</span>
                                                    {decision}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Suggested Topics */}
                                {briefing.suggestedTopics && briefing.suggestedTopics.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold uppercase text-violet-600 mb-2 flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" />
                                            Suggested Talking Points
                                        </h4>
                                        <ul className="space-y-1">
                                            {briefing.suggestedTopics.map((topic, i) => (
                                                <li key={i} className="text-sm flex items-start gap-2">
                                                    <span className="text-violet-500">{i + 1}.</span>
                                                    {topic}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpanded(!expanded)}
                                className="text-muted-foreground"
                            >
                                {expanded ? 'Show less' : 'Show full prep'}
                                <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                            </Button>
                            <Link href={`/meetings/${prep.meeting.id}`}>
                                <Button size="sm" className="gap-2">
                                    View Meeting
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Generate Briefing CTA */
                    <div className="text-center py-4">
                        <Button onClick={generateBriefing} disabled={generating} className="gap-2">
                            {generating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating briefing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate AI Briefing
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Get context, blockers, and talking points
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
