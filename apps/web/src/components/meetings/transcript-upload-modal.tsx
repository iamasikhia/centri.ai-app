
import { useState } from 'react';
import { SimpleModal } from '@/components/stakeholders/simple-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Meeting, TranscriptSegment } from '@/types/meeting';
import { Loader2, UploadCloud, FileText } from 'lucide-react';

interface TranscriptUploadModalProps {
    open: boolean;
    onClose: () => void;
    onUpload: (meeting: Meeting) => void;
}

export function TranscriptUploadModal({ open, onClose, onUpload }: TranscriptUploadModalProps) {
    const [title, setTitle] = useState('');
    const [transcriptText, setTranscriptText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') {
                setTranscriptText(text);
                // Auto-set title if empty
                if (!title) {
                    setTitle(file.name.replace(/\.[^/.]+$/, ""));
                }
            }
        };
        reader.readAsText(file);
    };

    const handleProcess = async () => {
        if (!title || !transcriptText) return;

        setIsProcessing(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        try {
            const res = await fetch(`${API_URL}/meetings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id' // Should ideally allow configurable user ID
                },
                body: JSON.stringify({
                    title,
                    date: new Date().toISOString(),
                    transcript: transcriptText
                })
            });

            if (!res.ok) {
                throw new Error('Failed to upload transcript');
                // In a real app, show error toast
            }

            const newMeetingData = await res.json();

            // Map backend response to frontend Meeting type
            // Note: The analysis starts in background, so initial details might be empty.
            // But title, date, id will be correct.
            const newMeeting: Meeting = {
                id: newMeetingData.id,
                title: newMeetingData.title,
                date: new Date(newMeetingData.startTime),
                durationMinutes: 60,
                source: 'Upload',
                type: 'Team Sync',
                status: 'processing', // Indicate it's being analyzed
                participants: [],
                summary: 'Processing AI analysis...', // Placeholder until viewed/refreshed
                keyTakeaways: [],
                decisions: [],
                actionItems: [],
                followUps: [],
                documents: [],
                transcript: [{ speaker: 'Transcript', text: transcriptText, timestamp: 0 }]
            };

            onUpload(newMeeting);
            setTitle('');
            setTranscriptText('');
            onClose();

        } catch (error) {
            console.error("Upload error:", error);
            // In a real app, show error state
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SimpleModal
            open={open}
            onClose={onClose}
            title="Upload Transcript"
            description="Paste your meeting transcript or upload a file below. We'll extract actionable intelligence."
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6 py-2">
                <div className="space-y-2">
                    <Label>Meeting Title</Label>
                    <Input
                        placeholder="e.g. Q4 Marketing Sync"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                        <span>Transcript Text</span>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="file-upload" className="cursor-pointer text-xs flex items-center gap-1 text-primary hover:underline">
                                <UploadCloud className="w-3 h-3" />
                                Upload File (.txt, .md, .vtt)
                            </Label>
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".txt,.md,.vtt"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </Label>
                    <div className="relative">
                        <Textarea
                            placeholder="Alice: Hi everyone, let's start.&#10;Bob: checking in on the project..."
                            className="min-h-[200px] font-mono text-sm resize-none"
                            value={transcriptText}
                            onChange={e => setTranscriptText(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleProcess} disabled={!title || !transcriptText || isProcessing}>
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4 mr-2" />
                                Process Transcript
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </SimpleModal>
    );
}
