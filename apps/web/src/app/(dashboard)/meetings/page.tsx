'use client';

import { useState, useEffect, useCallback } from 'react';
import { MOCK_MEETINGS } from '@/lib/mock-meetings';
import { MeetingsList } from '@/components/meetings/meetings-list';
import { TranscriptUploadModal } from '@/components/meetings/transcript-upload-modal';
import { TranscriptImportModal } from '@/components/meetings/transcript-import-modal';
import { Meeting } from '@/types/meeting';
import { Mic, Search, RefreshCw, Calendar, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { format } from 'date-fns';

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [calendarState, setCalendarState] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');

    // Default tab
    const [activeTab, setActiveTab] = useState<string>('upcoming');

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
                    source: (m.videoProvider === 'fathom' ? 'Zoom' : m.videoProvider) as any || 'Integration',
                    type: 'Team Sync',
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

    useEffect(() => {
        if (!isLoading && meetings.length > 0) {
            localStorage.setItem('centri_meetings', JSON.stringify(meetings));
        }
    }, [meetings, isLoading]);

    const handleUpload = (newMeeting: Meeting) => {
        setMeetings(prev => [newMeeting, ...prev]);
    };

    const handleImport = (platform: string) => {
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
    const sortedMeetings = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter Logic
    const now = new Date();
    const upcomingMeetings = sortedMeetings.filter(m => new Date(m.date) > now).reverse(); // Ascending for upcoming
    const pastMeetings = sortedMeetings.filter(m => new Date(m.date) <= now);

    // Group Past Meetings by Month
    const groupedPastMeetings = pastMeetings.reduce((groups, meeting) => {
        const monthYear = format(new Date(meeting.date), 'MMMM yyyy');
        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(meeting);
        return groups;
    }, {} as Record<string, Meeting[]>);

    const pastMonths = Object.keys(groupedPastMeetings);

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

            <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="grid w-[400px] grid-cols-3">
                        <TabsTrigger value="upcoming" className="gap-2">
                            Upcoming
                            <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                {upcomingMeetings.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="past" className="gap-2">
                            Past
                            <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                {pastMeetings.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="all" className="gap-2">
                            All
                            <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                {meetings.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative hidden sm:block">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search transcripts..."
                            className="bg-muted/50 border-none rounded-lg pl-9 pr-4 py-1.5 text-sm w-48 focus:ring-1 focus:ring-primary focus:bg-background transition-all"
                        />
                    </div>
                </div>

                <TabsContent value="upcoming" className="flex-1 mt-0">
                    {upcomingMeetings.length > 0 ? (
                        <MeetingsList meetings={upcomingMeetings} isCalendarConnected={calendarState === 'connected'} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-muted/5 border-dashed">
                            <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground font-medium">No upcoming meetings scheduled</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">Check back later or sync your calendar</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="flex-1 mt-0">
                    {pastMeetings.length > 0 ? (
                        <Accordion type="single" collapsible defaultValue={pastMonths[0]} className="space-y-4">
                            {pastMonths.map(month => (
                                <AccordionItem key={month} value={month} className="border rounded-lg bg-card px-4">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-base font-semibold">{month}</span>
                                            <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                                {groupedPastMeetings[month].length}
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4">
                                        <MeetingsList meetings={groupedPastMeetings[month]} isCalendarConnected={calendarState === 'connected'} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-muted/5 border-dashed">
                            <History className="w-10 h-10 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground font-medium">No past meetings found</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="all" className="flex-1 mt-0">
                    <MeetingsList meetings={sortedMeetings} isCalendarConnected={calendarState === 'connected'} />
                </TabsContent>
            </Tabs>

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
