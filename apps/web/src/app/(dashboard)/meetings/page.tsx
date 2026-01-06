
'use client';

import { useState, useEffect } from 'react';
import { MOCK_MEETINGS } from '@/lib/mock-meetings';
import { MeetingsList } from '@/components/meetings/meetings-list';
import { TranscriptUploadModal } from '@/components/meetings/transcript-upload-modal';
import { TranscriptImportModal } from '@/components/meetings/transcript-import-modal';
import { Meeting, MeetingStatus } from '@/types/meeting';
import { Mic, Search, Link } from 'lucide-react';

export default function MeetingsPage() {
    const [filter, setFilter] = useState<'all' | MeetingStatus>('all');
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem('centri_meetings');
        if (saved) {
            try {
                // Merge saved with Mock (or just use saved if initialized)
                // For this demo, we'll start with Mock + Saved New ones, 
                // but simpler to just use Mock as base if storage is empty, else use storage.
                // Re-hydrate dates because JSON strings
                const parsed = JSON.parse(saved).map((m: any) => ({
                    ...m,
                    date: new Date(m.date),
                    actionItems: m.actionItems.map((a: any) => ({ ...a, dueDate: a.dueDate ? new Date(a.dueDate) : undefined }))
                }));
                setMeetings(parsed);
            } catch (e) {
                setMeetings(MOCK_MEETINGS);
            }
        } else {
            setMeetings(MOCK_MEETINGS);
        }
        setIsLoading(false);
    }, []);

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
        if (filter === 'all') return true;
        return m.status === filter;
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
                        onClick={() => setIsImportOpen(true)} // Open Import Modal
                        className="flex items-center gap-2 px-4 py-2.5 bg-background border text-foreground rounded-lg font-medium shadow-sm hover:bg-muted transition-all"
                    >
                        <Link className="w-4 h-4" />
                        <span>Get from Integration</span>
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
            <div className="flex items-center gap-4 mb-6 border-b pb-1 overflow-x-auto">
                {(['all', 'processed', 'needs-review'] as const).map((tab) => (
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
                        {tab === 'all' ? 'All Meetings' : tab === 'processed' ? 'Processed' : 'Needs Review'}
                        <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full opacity-70">
                            {tab === 'all'
                                ? meetings.length
                                : meetings.filter(m => m.status === tab).length
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

            <MeetingsList meetings={filtered} />

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
