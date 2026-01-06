
'use client';

import { useState } from 'react';
import { TranscriptSegment } from '@/types/meeting';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

export function TranscriptViewer({ transcript }: { transcript: TranscriptSegment[] }) {
    const [isOpen, setIsOpen] = useState(false);

    if (transcript.length === 0) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="border rounded-xl bg-card overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <MessageSquare className="w-4 h-4" />
                    Transcript
                    <span className="text-muted-foreground font-normal ml-2 text-xs">
                        {transcript.length} segments
                    </span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isOpen && (
                <div className="max-h-[500px] overflow-y-auto p-4 space-y-4 bg-background">
                    {transcript.map((seg, i) => (
                        <div key={i} className={`flex gap-4 p-3 rounded-lg ${seg.isHighlighted ? 'bg-amber-500/10 border border-amber-500/20' : ''}`}>
                            <div className="w-12 flex-shrink-0 text-right text-xs text-muted-foreground font-mono mt-1">
                                {formatTime(seg.timestamp)}
                            </div>
                            <div className="flex-1">
                                <span className="block text-xs font-bold text-foreground mb-0.5">
                                    {seg.speaker}
                                </span>
                                <p className="text-sm text-foreground/90 leading-relaxed">
                                    {seg.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
