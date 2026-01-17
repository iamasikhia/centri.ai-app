'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Building2,
    Activity,
    Cpu,
    Server,
    ScrollText,
    Moon,
    Sun,
    MessageCircle,
    ClipboardCheck,
    BarChart3,
    MessageSquarePlus,
    Puzzle
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'User Insights', href: '/user-insights', icon: BarChart3 },
    { name: 'Organizations', href: '/organizations', icon: Building2 },
    { name: 'Onboarding Insights', href: '/onboarding-insights', icon: ClipboardCheck },
    { name: 'User Feedback', href: '/feedback', icon: MessageSquarePlus },
    { name: 'Integration Requests', href: '/integration-requests', icon: Puzzle },
    { name: 'Integrations', href: '/integrations', icon: Activity },
    { name: 'Ask AI', href: '/chat', icon: MessageCircle },
];

export function Sidebar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-muted/10">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b px-6">
                <img
                    src="/logo.png"
                    alt="Centri Logo"
                    width="32"
                    height="32"
                    style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    className="rounded"
                    onError={(e) => {
                        console.error('Sidebar logo failed to load');
                        e.currentTarget.src = '/centri-logo.png';
                    }}
                />
                <span className="text-lg font-semibold">Centri Admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Theme Toggle */}
            <div className="border-t p-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full justify-start"
                >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="ml-2">Toggle theme</span>
                </Button>
            </div>
        </div>
    );
}
