import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

const figtree = Figtree({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Centri.ai',
    description: 'Pre-meeting and day-start dashboard for managers',
    icons: {
        icon: [
            { url: '/icon.png', type: 'image/png' },
            { url: '/logo.png', type: 'image/png' },
        ],
        shortcut: '/logo.png',
        apple: '/apple-icon.png',
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
