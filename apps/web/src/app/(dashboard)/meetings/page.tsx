
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MOCK_MEETINGS } from '@/lib/mock-meetings';
import { MeetingsList } from '@/components/meetings/meetings-list';
import { TranscriptUploadModal } from '@/components/meetings/transcript-upload-modal';
import { TranscriptImportModal } from '@/components/meetings/transcript-import-modal';
import { Meeting, MeetingStatus } from '@/types/meeting';
import { Mic, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MeetingsPage() {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all'); // Reformatted by Antigravity
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);


    const [calendarState, setCalendarState] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');

    const fetchStatus = useCallback(async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${API_URL}/integrations/status`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const connections: any[] = await res.json();
                const isConnected = connections.some(c => c.provider === 'google' || c.provider === 'google_calendar' || c.provider === 'google_meet' || c.provider === 'zoom');
                setCalendarState(isConnected ? 'connected' : 'disconnected');
            } else {
                setCalendarState('error');
            }
        } catch (e) {
            console.error("Failed to fetch integration status", e);
            setCalendarState('error');
        }
    }, []);

    const fetchMeetings = useCallback(async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            const res = await fetch(`${API_URL}/meetings`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const data = await res.json();
                const mapped: Meeting[] = data.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    date: new Date(m.startTime),
                    durationMinutes: Math.floor((new Date(m.endTime).getTime() - new Date(m.startTime).getTime()) / 60000),
                    participants: m.attendeesJson ? JSON.parse(m.attendeesJson) : [],
                    source: (m.videoProvider === 'fathom' ? 'Zoom' : m.videoProvider) as any || 'Integration', // Cast to any to bypass strict check for now
                    type: 'Team Sync', // Default
                    status: 'processed',
                    summary: m.summary || 'No summary available.',
                    keyTakeaways: m.highlightsJson ? JSON.parse(m.highlightsJson) : [],
                    decisions: [],
                    actionItems: m.actionItemsJson ? JSON.parse(m.actionItemsJson) : [],
                    followUps: [],
                    documents: [],
                    transcript: m.transcript ? [{ speaker: 'Transcript', text: m.transcript, timestamp: 0 }] : []
                }));
                setMeetings(mapped);
            } else {
                setMeetings(MOCK_MEETINGS);
            }
        } catch (e) {
            console.error("Failed to fetch meetings", e);
            setMeetings(MOCK_MEETINGS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchStatus().then(() => {
            fetchMeetings();
        });
    }, [fetchStatus, fetchMeetings]);

    const handleSync = async () => {
        setIsSyncing(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
            await fetch(`${API_URL}/integrations/sync`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
            await fetchMeetings();
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setIsSyncing(false);
        }
    };

    // Save on Change
    useEffect(() => {
        if (!isLoading && meetings.length > 0) {
            localStorage.setItem('centri_meetings', JSON.stringify(meetings));
        }
    }, [meetings, isLoading]);

    const handleUpload = (newMeeting: Meeting) => {
        setMeetings(prev => [newMeeting, ...prev]);
    };

    const handleImport = (platform: string) => {
        // Mock imported meeting
        const newMeeting: Meeting = {
            id: `imp-${Date.now()}`,
            title: `Weekly Sync (${platform})`,
            date: new Date(),
            durationMinutes: 45,
            source: 'Integration',
            type: 'Team Sync',
            status: 'needs-review',
            participants: [{ name: 'Team', email: 'team@example.com', role: 'Staff' }],
            summary: `Automated import from ${platform}. Analysis pending...`,
            keyTakeaways: ['Meeting imported successfully'],
            decisions: [],
            actionItems: [],
            followUps: [],
            documents: [],
            transcript: []
        };
        setMeetings(prev => [newMeeting, ...prev]);
    };

    // Sort by date desc
    const sorted = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filtered = sorted.filter(m => {
        const now = new Date();
        const meetingDate = new Date(m.date);
        if (filter === 'all') return true;
        if (filter === 'upcoming') return meetingDate > now;
        if (filter === 'past') return meetingDate <= now;
        return true;
    });

    if (isLoading) {
        return <div className="p-10 text-center text-muted-foreground">Loading meetings...</div>;
    }

    return (
        <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto w-full">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Meetings Intelligence</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        AI-generated briefings, decisions, and action items from your team syncs and 1:1s.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 bg-background border text-foreground rounded-lg font-medium shadow-sm hover:bg-muted transition-all",
                            isSyncing && "opacity-80 cursor-not-allowed"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Transcripts'}</span>
                    </button>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:opacity-90 transition-all"
                    >
                        <Mic className="w-4 h-4" />
                        <span>Upload Transcript</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-end gap-4 mb-6 border-b overflow-x-auto">
                {(['all', 'upcoming', 'past'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`
                            px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                            ${filter === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }
                        `}
                    >
                        {tab === 'all' ? 'All Meetings' : tab === 'upcoming' ? 'Upcoming' : 'Past Meetings'}
                        <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full opacity-70">
                            {tab === 'all'
                                ? meetings.length
                                : meetings.filter(m => {
                                    const now = new Date();
                                    const meetingDate = new Date(m.date);
                                    if (tab === 'upcoming') return meetingDate > now;
                                    if (tab === 'past') return meetingDate <= now;
                                    return false;
                                }).length
                            }
                        </span>
                    </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                    <div className="relative hidden sm:block">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search transcripts..."
                            className="bg-muted/50 border-none rounded-lg pl-9 pr-4 py-1.5 text-sm w-48 focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                        />
                    </div>
                </div>
            </div>

            <MeetingsList meetings={filtered} isCalendarConnected={calendarState === 'connected'} />

            <TranscriptUploadModal
                open={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
            />

            <TranscriptImportModal
                open={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleImport}
            />
        </div>
    );
}
