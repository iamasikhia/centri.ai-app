import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

const figtree = Figtree({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: {
        default: 'Centri.ai - Meeting Intelligence AI',
        template: '%s | Centri.ai'
    },
    description: 'Your Meeting Intelligence AI. Centri.ai helps managers stay on top of team updates, meeting decisions, and project progress with AI-powered insights.',
    keywords: ['meeting intelligence', 'AI assistant', 'product management', 'team updates', 'meeting notes', 'stakeholder updates'],
    authors: [{ name: 'Centri.ai' }],
    creator: 'Centri.ai',
    publisher: 'Centri.ai',
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://centri.ai',
        siteName: 'Centri.ai',
        title: 'Centri.ai - Meeting Intelligence AI',
        description: 'Your Meeting Intelligence AI. Stay on top of team updates, meeting decisions, and project progress.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Centri.ai - Meeting Intelligence AI',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Centri.ai - Meeting Intelligence AI',
        description: 'Your Meeting Intelligence AI. Stay on top of team updates, meeting decisions, and project progress.',
        images: ['/og-image.png'],
    },
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/icon.png', type: 'image/png', sizes: '32x32' },
            { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
            { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
        ],
        shortcut: '/favicon.ico',
        apple: '/apple-icon.png',
    },
    manifest: '/manifest.json',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    ],
}

import { Providers } from '@/components/providers'

// ... existing imports

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  var storageKey = 'centri-theme';
                  var theme = localStorage.getItem(storageKey);
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!theme || theme === 'system') {
                    if (supportDarkMode) {
                      document.documentElement.classList.add('dark');
                    }
                  } else if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
                    }}
                />
            </head>
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
