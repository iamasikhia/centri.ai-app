import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

const figtree = Figtree({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Centri.ai',
    description: 'Pre-meeting and day-start dashboard for managers',
    icons: {
        icon: '/logo.png',
        shortcut: '/logo.png',
        apple: '/logo.png',
    },
}

import { Providers } from '@/components/providers'

// ... existing imports

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={figtree.className}>
                <Providers>
                    <div className="flex h-screen bg-background">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    )
}
