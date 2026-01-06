
'use client';

import { useState, useEffect } from 'react';
import { MOCK_MEETINGS } from '@/lib/mock-meetings';
import { MeetingSummary } from '@/components/meetings/meeting-summary';
import { MeetingDecisions } from '@/components/meetings/meeting-decisions';
import { MeetingActionItems } from '@/components/meetings/meeting-action-items';
import { TranscriptViewer } from '@/components/meetings/transcript-viewer';
import { Meeting } from '@/types/meeting';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Users, FileText, Share2, MoreHorizontal, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
    const [meeting, setMeeting] = useState<Meeting | null | undefined>(undefined);

    useEffect(() => {
        // Hydrate from storage or fallback to mock
        const saved = localStorage.getItem('centri_meetings');
        let allMeetings = MOCK_MEETINGS;

        if (saved) {
            try {
                const parsed = JSON.parse(saved).map((m: any) => ({
                    ...m,
                    date: new Date(m.date),
                    actionItems: m.actionItems.map((a: any) => ({ ...a, dueDate: a.dueDate ? new Date(a.dueDate) : undefined }))
                }));
                // If storage overrides everything, use parsed. 
                // But usually we merged in the list page.
                // For safety, let's search in parsed, if not found, search in MOCK (for fresh tabs).
                // Actually list page initialized storage with MOCK if empty.
                allMeetings = parsed;
            } catch (e) {
                console.error("Failed to parse meetings", e);
            }
        }

        const found = allMeetings.find(m => m.id === params.id) || MOCK_MEETINGS.find(m => m.id === params.id);
        setMeeting(found || null);
    }, [params.id]);

    if (meeting === undefined) {
        return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
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
                </div>

                {/* 2. Executive Summary */}
                <section>
                    <MeetingSummary summary={meeting.summary} takeaways={meeting.keyTakeaways} />
                </section>

                <hr className="border-border/50" />

                {/* 3. Decisions & Actions Grid */}
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

                {/* 4. Action Items (Full Width) */}
                <section>
                    <MeetingActionItems actions={meeting.actionItems} />
                </section>

                <hr className="border-border/50" />

                {/* 5. Transcript */}
                <section>
                    <TranscriptViewer transcript={meeting.transcript} />
                </section>

            </div>
        </div>
    );
}
