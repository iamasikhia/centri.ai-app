
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

    const handleProcess = async () => {
        if (!title || !transcriptText) return;

        setIsProcessing(true);

        // Simulate AI Processing time
        await new Promise(r => setTimeout(r, 1500));

        // 1. Parse Transcript (Simple mock parser)
        // Assumes "Speaker: Text" format or just newlines
        const lines = transcriptText.split('\n').filter(l => l.trim());
        const transcript: TranscriptSegment[] = lines.map((line, i) => {
            const parts = line.split(':');
            const speaker = parts.length > 1 ? parts[0].trim() : 'Unknown Speaker';
            const text = parts.length > 1 ? parts.slice(1).join(':').trim() : line;
            return {
                speaker,
                text,
                timestamp: i * 30, // Mock 30s increments
                isHighlighted: text.toLowerCase().includes('decision') || text.toLowerCase().includes('action')
            };
        });

        // 2. Generate Mock Intelligence
        const newMeeting: Meeting = {
            id: `m-${Date.now()}`,
            title,
            date: new Date(),
            durationMinutes: Math.max(15, lines.length * 2),
            source: 'Upload',
            type: 'Team Sync',
            status: 'processed',
            participants: [
                { name: 'You', email: 'you@company.com', role: 'User' },
                { name: 'Team Member', email: 'member@company.com', role: 'Staff' }
            ],
            summary: `This meeting focused on "${title}". Key points included reviewing current progress and establishing next steps based on the uploaded transcript.`,
            keyTakeaways: [
                'Transcript successfully uploaded and processed.',
                'Action items identified from context.', // Mock
                'Next steps clarified.'
            ],
            decisions: [
                { id: `d-${Date.now()}`, text: 'Proceed with the plan as discussed in the transcript.', timestamp: 60 }
            ],
            actionItems: [
                {
                    id: `a-${Date.now()}`,
                    description: 'Review the full transcript details',
                    owner: 'You',
                    type: 'create-doc',
                    status: 'pending',
                    priority: 'medium',
                    dueDate: new Date()
                }
            ],
            followUps: [],
            documents: [],
            transcript
        };

        onUpload(newMeeting);
        setIsProcessing(false);
        setTitle('');
        setTranscriptText('');
        onClose();
    };

    return (
        <SimpleModal
            open={open}
            onClose={onClose}
            title="Upload Transcript"
            description="Paste your meeting transcript below. We'll extract actionable intelligence."
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
                        <span className="text-xs text-muted-foreground font-normal">Supports "Speaker: Message" format</span>
                    </Label>
                    <div className="relative">
                        <Textarea
                            placeholder="Alice: Hi everyone, let's start.&#10;Bob: checking in on the project..."
                            className="min-h-[200px] font-mono text-sm resize-none"
                            value={transcriptText}
                            onChange={e => setTranscriptText(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                <FileText className="w-4 h-4" />
                            </Button>
                        </div>
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
