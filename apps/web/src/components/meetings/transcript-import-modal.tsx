'use client';

import { useState } from 'react';
import { SimpleModal } from '@/components/stakeholders/simple-modal';
import { Button } from '@/components/ui/button';
import { Loader2, Video, AppWindow, Mic, Bot } from 'lucide-react';

interface TranscriptImportModalProps {
    open: boolean;
    onClose: () => void;
    onImport?: (platform: string) => void;
}

export function TranscriptImportModal({ open, onClose, onImport }: TranscriptImportModalProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSelect = (platform: string) => {
        setIsLoading(platform);
        // Mock connection/fetch delay
        setTimeout(() => {
            setIsLoading(null);
            if (onImport) onImport(platform);
            onClose();
        }, 1500);
    };

    const platforms = [
        { id: 'google-meet', name: 'Google Meet', icon: Video, color: 'text-green-600 bg-green-50' },
        { id: 'zoom', name: 'Zoom', icon: Video, color: 'text-blue-500 bg-blue-50' },
        { id: 'teams', name: 'Microsoft Teams', icon: AppWindow, color: 'text-purple-600 bg-purple-50' },
        { id: 'otter', name: 'Otter.ai', icon: Mic, color: 'text-indigo-600 bg-indigo-50' },
        { id: 'fathom', name: 'Fathom', icon: Video, color: 'text-teal-600 bg-teal-50' },
        { id: 'fireflies', name: 'Fireflies.ai', icon: Bot, color: 'text-blue-600 bg-blue-50' },
    ];

    return (
        <SimpleModal
            open={open}
            onClose={onClose}
            title="Import from Integration"
            description="Select a platform to fetch your recent meeting transcripts."
            maxWidth="max-w-md"
        >
            <div className="grid gap-3 py-4">
                {platforms.map(p => (
                    <Button
                        key={p.id}
                        variant="outline"
                        className="h-16 justify-start relative overflow-hidden group hover:border-primary/50 hover:bg-muted/50 transition-all"
                        onClick={() => handleSelect(p.name)}
                        disabled={!!isLoading}
                    >
                        {isLoading === p.name ? (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 animate-in fade-in">
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    Connecting...
                                </span>
                            </div>
                        ) : null}

                        <div className={`p-2.5 rounded-lg mr-4 ${p.color} shrink-0`}>
                            <p.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-xs text-muted-foreground truncate">Fetch recent meetings</div>
                        </div>
                    </Button>
                ))}
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2">
                Make sure you have connected these accounts in Settings.
            </div>
        </SimpleModal>
    );
}
