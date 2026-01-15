
'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider defaultTheme="system" storageKey="centri-theme">
                {children}
                <Toaster />
            </ThemeProvider>
        </SessionProvider>
    );
}
