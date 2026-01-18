
'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from "@/contexts/subscription-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider defaultTheme="system" storageKey="centri-theme">
                <SubscriptionProvider>
                    {children}
                    <Toaster />
                </SubscriptionProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
