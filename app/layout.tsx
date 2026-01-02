import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Centri – Personal Work Clarity',
    description: 'Understand where your work energy went today',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Sidebar />
                <div className="ml-64">
                    {children}
                </div>
            </body>
        </html>
    )
}
