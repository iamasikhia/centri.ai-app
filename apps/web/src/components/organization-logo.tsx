
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function OrganizationLogo({ name, website, className }: { name: string, website?: string, className?: string }) {
    const [src, setSrc] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!website) {
            setError(true);
            return;
        }

        try {
            const domain = new URL(website).hostname.replace(/^www\./, '');
            // Start with Clearbit
            setSrc(`https://logo.clearbit.com/${domain}`);
            setError(false);
        } catch (e) {
            // Invalid URL
            setError(true);
        }
    }, [website]);

    const handleError = () => {
        // If Clearbit fails, try Google Favicon as a one-time fallback
        if (src.includes('clearbit')) {
            try {
                const domain = new URL(website!).hostname.replace(/^www\./, '');
                setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
            } catch {
                setError(true);
            }
        } else {
            // If Google fails (or anything else), show text
            setError(true);
        }
    };

    if (error || !src) {
        return (
            <div className={cn("flex items-center justify-center bg-secondary text-secondary-foreground font-bold text-xl rounded-lg border w-full h-full select-none", className)}>
                {name.charAt(0)}
            </div>
        );
    }

    return (
        <div className={cn("bg-white rounded-lg border flex items-center justify-center p-2 overflow-hidden relative", className)}>
            <img
                src={src}
                alt={name}
                className="w-full h-full object-contain"
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
}
