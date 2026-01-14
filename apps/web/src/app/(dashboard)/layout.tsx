import { Sidebar } from '@/components/sidebar'
import { FloatingChat } from '@/components/chat/floating-chat'
import { ChatProvider } from '@/components/chat/chat-provider'
import { NotificationsSheet } from '@/components/dashboard/notifications-sheet'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/command-palette'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ChatProvider>
            <div className="flex h-screen w-full">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background p-8">
                    {children}
                </main>
                <FloatingChat />
                <NotificationsSheet />
            </div>
            <Toaster />
            <CommandPalette />
        </ChatProvider>
    )
}
