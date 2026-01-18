'use client';

import { Sidebar } from '@/components/sidebar'
import { FloatingChat } from '@/components/chat/floating-chat'
import { ChatProvider } from '@/components/chat/chat-provider'
import { NotificationsSheet } from '@/components/dashboard/notifications-sheet'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/command-palette'
import { ActivityTracker } from '@/hooks/use-activity-tracker'
import { FeedbackWidget } from '@/components/feedback/feedback-widget'
import { TeamModeProvider } from '@/contexts/team-mode-context'
import { NavigationProgress } from '@/components/navigation-progress'
import { useSubscription } from '@/contexts/subscription-context'
import { hasFeature } from '@/lib/subscription'
import { Suspense } from 'react'

function FloatingChatGate() {
    const { tier } = useSubscription();
    
    if (!hasFeature(tier, 'chatCopilot')) {
        return null;
    }
    
    return <FloatingChat />;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TeamModeProvider>
            <ChatProvider>
                <Suspense fallback={null}>
                    <NavigationProgress />
                </Suspense>
                <ActivityTracker />
                <div className="flex h-screen w-full">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto bg-background p-8">
                        {children}
                    </main>
                    <FloatingChatGate />
                    <NotificationsSheet />
                    <FeedbackWidget />
                </div>
                <Toaster />
                <CommandPalette />
            </ChatProvider>
        </TeamModeProvider>
    )
}
