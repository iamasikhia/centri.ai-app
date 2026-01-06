'use client';
import { useEffect, useRef, useState } from 'react';
import { ArchitectureData } from '@/types/chat';
import { Loader2 } from 'lucide-react';

declare global {
    interface Window {
        mermaid: any;
    }
}

export function ArchitectureCanvas({ data }: { data: ArchitectureData }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !window.mermaid) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
            script.onload = () => {
                window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
                setIsLoaded(true);
            };
            document.head.appendChild(script);
        } else if (typeof window !== 'undefined' && window.mermaid) {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        const renderDiagram = async () => {
            if (isLoaded && elementRef.current && data.mermaidCode) {
                try {
                    // Unique ID for this render to avoid conflicts
                    const id = `mermaid-${Date.now()}`;
                    if (window.mermaid.render) {
                        const { svg } = await window.mermaid.render(id, data.mermaidCode);
                        elementRef.current.innerHTML = svg;
                    }
                } catch (e) {
                    console.error('Mermaid render error:', e);
                    // Fallback to showing code if error
                    elementRef.current.innerHTML = `<div class="p-4 text-red-500 border border-red-200 rounded bg-red-50">Error rendering diagram. Code:<pre class="mt-2 text-xs">${data.mermaidCode}</pre></div>`;
                }
            }
        };
        renderDiagram();
    }, [isLoaded, data.mermaidCode]);

    return (
        <div className="h-full flex flex-col overflow-hidden bg-background">
            <div className="p-6 border-b bg-muted/10 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{data.title}</h2>
                        <p className="text-muted-foreground mt-1 max-w-xl">{data.description}</p>
                    </div>
                    {/* Add Export button later */}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-center min-h-[400px]">
                {!isLoaded ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Initializing Diagram Engine...
                    </div>
                ) : (
                    <div ref={elementRef} className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto shadow-sm p-4 bg-background rounded-xl border" />
                )}
            </div>
            <div className="p-2 border-t text-xs text-center text-muted-foreground bg-background">
                Powered by Mermaid.js
            </div>
        </div>
    );
}
