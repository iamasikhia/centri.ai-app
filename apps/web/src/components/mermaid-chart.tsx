'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
    interface Window {
        mermaid: any;
    }
}

export function MermaidChart({ chart }: { chart: string }) {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const renderChart = async () => {
            try {
                // Ensure mermaid is loaded
                if (!window.mermaid) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });

                    window.mermaid.initialize({
                        startOnLoad: false,
                        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                        securityLevel: 'loose',
                    });
                }

                // Generate unique ID
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                // Render
                const { svg } = await window.mermaid.render(id, chart);
                setSvg(svg);
                setError(null);
            } catch (e: any) {
                console.error('Mermaid render error:', e);
                // Fallback for syntax errors? 
                setError('Failed to render flow chart');
            } finally {
                setLoading(false);
            }
        };

        renderChart();
    }, [chart]);

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-xs text-red-600 dark:text-red-400 font-mono overflow-auto">
                {error}
                <pre className="mt-2 text-[10px] text-muted-foreground">{chart}</pre>
            </div>
        );
    }

    return (
        <div
            className="mermaid-wrapper flex justify-center bg-card bg-opacity-50 p-4 rounded-lg overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
