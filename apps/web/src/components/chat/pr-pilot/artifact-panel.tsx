'use client';
import { Artifact } from '@/types/chat';
import { PRDCanvas } from './prd-canvas';
import { ArchitectureCanvas } from './architecture-canvas';
import { X } from 'lucide-react';

export function ArtifactPanel({ artifact, onClose }: { artifact: Artifact, onClose: () => void }) {
    return (
        <div className="flex flex-col h-full border-l bg-background shadow-2xl md:shadow-none w-full md:w-[55%] shrink-0 transition-all absolute inset-0 md:static z-20 md:z-0 animate-in slide-in-from-right-10 duration-300">
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={onClose}
                    className="p-1.5 bg-background/80 backdrop-blur hover:bg-muted rounded-full shadow-sm border transition-colors"
                    title="Close Panel"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {artifact.type === 'prd' && <PRDCanvas data={artifact.content} />}
            {artifact.type === 'architecture' && <ArchitectureCanvas data={artifact.content} />}
            {artifact.type === 'document' && (
                <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                    <span className="text-4xl">📄</span>
                    <p>Document preview coming soon</p>
                </div>
            )}
        </div>
    );
}
