
'use client';

import { useState, useEffect } from 'react';
import { MeetingSummary } from '@/components/meetings/meeting-summary';
import { MeetingDecisions } from '@/components/meetings/meeting-decisions';
import { MeetingActionItems } from '@/components/meetings/meeting-action-items';
import { TranscriptViewer } from '@/components/meetings/transcript-viewer';
import { SpeakerInvolvementCard } from '@/components/meetings/speaker-involvement';
import { Meeting } from '@/types/meeting';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Users, FileText, Share2, MoreHorizontal, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
    const [meeting, setMeeting] = useState<Meeting | null | undefined>(undefined);

    useEffect(() => {
        const fetchMeeting = async () => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
                const res = await fetch(`${API_URL}/meetings/${params.id}`, {
                    headers: { 'x-user-id': 'default-user-id' }
                });

                if (res.ok) {
                    const m = await res.json();
                    const mapped: Meeting = {
                        id: m.id,
                        title: m.title,
                        date: new Date(m.startTime),
                        durationMinutes: Math.floor((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000),
                        participants: m.attendeesJson ? JSON.parse(m.attendeesJson) : [],
                        source: (m.videoProvider === 'fathom' ? 'Zoom' : m.videoProvider) as any || 'Integration',
                        type: 'Team Sync',
                        status: (m.processingStatus as any) || 'processed',
                        summary: m.summary || 'No summary available.',
                        keyTakeaways: m.highlightsJson ? JSON.parse(m.highlightsJson) : [],
                        decisions: (m.decisionsJson ? JSON.parse(m.decisionsJson) : []).map((d: any, i: number) => {
                            if (typeof d === 'string') {
                                return {
                                    id: `dec-${m.id}-${i}`,
                                    text: d,
                                    timestamp: 0,
                                    category: 'General'
                                };
                            }
                            return {
                                ...d,
                                id: d.id || `dec-${m.id}-${i}`,
                                text: d.text || d.description || 'Decision'
                            };
                        }),
                        actionItems: (m.actionItemsJson ? JSON.parse(m.actionItemsJson) : []).map((item: any, i: number) => {
                            if (typeof item === 'string') {
                                return {
                                    id: `action-${m.id}-${i}`,
                                    description: item,
                                    type: 'task',
                                    owner: 'User',
                                    dueDate: null
                                };
                            }
                            return {
                                ...item,
                                id: item.id || `action-${m.id}-${i}`,
                                description: item.description || item.text || 'Action Item',
                                type: item.type || 'task'
                            };
                        }),
                        followUps: [],
                        documents: [],
                        speakerInvolvement: m.speakerInvolvementJson ? JSON.parse(m.speakerInvolvementJson) : undefined,
                        transcript: m.transcriptJson
                            ? JSON.parse(m.transcriptJson).map((t: any) => ({
                                speaker: t.speaker || 'Unknown',
                                text: t.text,
                                timestamp: t.timestamp || 0,
                                isHighlighted: t.isHighlighted || false
                            }))
                            : (m.transcript ? [{ speaker: 'Transcript', text: m.transcript, timestamp: 0 }] : [])
                    };
                    setMeeting(mapped);
                } else {
                    console.warn(`Meeting ${params.id} not found on API`);
                    const found = null;
                    setMeeting(found || null);
                }
            } catch (e) {
                console.error("Failed to fetch meeting details", e);
                const found = null;
                setMeeting(found || null);
            }
        };

        fetchMeeting();
    }, [params.id]);

    const handleRetry = async () => {
        if (!meeting) return;
        setMeeting({ ...meeting, status: 'processing', summary: 'Re-analyzing transcript...' });

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${API_URL}/meetings/${params.id}/analyze`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });

            if (res.ok) {
                // Determine new status from valid response if possible, or just force reload
                const m = await res.json();
                // Instead of fully mapping here again, simpler to just trigger the useEffect to refetch
                // But we can also just reload window or update state. 
                // For valid immediate feedback, let's reload the page content by calling fetchMeeting logic if extracted,
                // or just force a reload for simplicity.
                window.location.reload();
            } else {
                alert('Analysis retry failed.');
                setMeeting({ ...meeting, status: 'failed' });
            }
        } catch (e) {
            console.error("Retry failed", e);
            setMeeting({ ...meeting, status: 'failed' });
        }
    };

    if (meeting === undefined) {
        return (
            <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
                {/* Header Skeleton */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="h-6 w-px bg-border hidden sm:block" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-64" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-28 rounded-lg" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                </div>
                {/* Content Skeleton */}
                <div className="flex-1 p-6 md:p-10 space-y-10">
                    {/* Participants Bar */}
                    <Skeleton className="h-16 w-full rounded-xl" />
                    {/* Summary Section */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-px w-full" />
                    {/* Decisions & Actions Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </div>
                    </div>
                    <Skeleton className="h-px w-full" />
                    {/* Transcript Section */}
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (meeting === null) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <h2 className="text-xl font-bold">Meeting Not Found</h2>
                <Link href="/meetings" className="text-primary hover:underline">Back to Meetings</Link>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
            {/* Header / Nav */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/meetings" className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-px bg-border hidden sm:block" />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight line-clamp-1">{meeting.title}</h1>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(meeting.date), 'MMMM d, yyyy • h:mm a')}
                            </span>
                            <span>•</span>
                            <span>{meeting.durationMinutes} min</span>
                            <span>•</span>
                            <span className="capitalize">{meeting.source}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRetry}
                        disabled={meeting.status === 'processing'}
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", meeting.status === 'processing' && "animate-spin")} />
                        {meeting.status === 'processing' ? 'Analyzing...' : 'Re-Analyze'}
                    </button>
                    <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                        <Share2 className="w-4 h-4" /> Share Brief
                    </button>
                    <button className="p-2 border rounded-lg hover:bg-muted transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">

                {/* 1. Overview / Participants (Simple row) */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex -space-x-2">
                            {meeting.participants.map((p, i) => (
                                <div key={i} className="w-8 h-8 rounded-full ring-2 ring-background bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-foreground overflow-hidden" title={`${p.name} - ${p.role}`}>
                                    {p.avatar ? (
                                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        p.name.charAt(0)
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-muted-foreground ml-2">
                            {meeting.participants.map(p => p.name.split(' ')[0]).join(', ')}
                        </div>
                    </div>
                    {meeting.status === 'processed' && (
                        <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-xs font-semibold">
                            AI Processed
                        </div>
                    )}
                    {meeting.status === 'processing' && (
                        <div className="px-2.5 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-full text-xs font-semibold animate-pulse">
                            Processing Transcript...
                        </div>
                    )}
                    {meeting.status === 'failed' && (
                        <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full text-xs font-semibold">
                                Processing Failed
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleRetry}>Retry</Button>
                        </div>
                    )}
                </div>

                {/* 2. Speaker Involvement */}
                {meeting.speakerInvolvement && meeting.speakerInvolvement.length > 0 && (
                    <>
                        <section>
                            <SpeakerInvolvementCard 
                                involvement={meeting.speakerInvolvement} 
                                meetingDurationMinutes={meeting.durationMinutes}
                            />
                        </section>
                        <hr className="border-border/50" />
                    </>
                )}

                {/* 3. Executive Summary */}
                <section>
                    <MeetingSummary summary={meeting.summary} takeaways={meeting.keyTakeaways} />
                </section>

                <hr className="border-border/50" />

                {/* 4. Decisions & Actions Grid */}
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    <section>
                        <MeetingDecisions decisions={meeting.decisions} />
                    </section>

                    {meeting.documents && meeting.documents.length > 0 && (
                        <section>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                                <FileText className="w-4 h-4 text-zinc-500" />
                                Referenced Docs
                            </h3>
                            <div className="space-y-3">
                                {meeting.documents.map(doc => (
                                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group">
                                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-md">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium group-hover:text-primary transition-colors">{doc.title}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{doc.type}</div>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* 5. Action Items (Full Width) */}
                <section>
                    <MeetingActionItems actions={meeting.actionItems} />
                </section>

                <hr className="border-border/50" />

                {/* 6. Transcript */}
                <section>
                    <TranscriptViewer transcript={meeting.transcript} />
                </section>

            </div>
        </div>
    );
}
