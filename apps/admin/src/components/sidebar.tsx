'use client';

import React from 'react';
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
    Puzzle,
    DollarSign
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

const navigation = [
    // Tier 1: Critical - Most Important (Business & Core Operations)
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Revenue', href: '/revenue', icon: DollarSign },
    { name: 'Users', href: '/users', icon: Users },
    
    // Tier 2: Analytics & Insights (Performance Monitoring)
    { name: 'User Insights', href: '/user-insights', icon: BarChart3 },
    
    // Tier 3: Operations (Product Functionality)
    { name: 'Integrations', href: '/integrations', icon: Activity },
    
    // Tier 4: Support & Growth (User Engagement)
    { name: 'User Feedback', href: '/feedback', icon: MessageSquarePlus },
    { name: 'Onboarding Insights', href: '/onboarding-insights', icon: ClipboardCheck },
    { name: 'Integration Requests', href: '/integration-requests', icon: Puzzle },
    
    // Tier 5: Secondary Features (Less Frequently Used)
    { name: 'Organizations', href: '/organizations', icon: Building2 },
    { name: 'Ask AI', href: '/chat', icon: MessageCircle },
];

export function Sidebar() {
    const [mounted, setMounted] = React.useState(false);
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    // Prevent hydration mismatch by only accessing client-only hooks after mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render anything theme-dependent until mounted
    if (!mounted) {
        return (
            <div className="flex h-screen w-64 flex-col border-r bg-muted/10">
                <div className="flex h-16 items-center gap-2 border-b px-6">
                    <div className="w-8 h-8 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                </div>
                <nav className="flex-1 space-y-1 p-4">
                    {navigation.map((item) => (
                        <div key={item.name} className="h-10 bg-muted animate-pulse rounded-lg" />
                    ))}
                </nav>
                <div className="border-t p-4">
                    <div className="h-9 w-full rounded-lg border bg-background" />
                </div>
            </div>
        );
    }

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
                        e.currentTarget.src = '/centri-logo.png';
                    }}
                />
                <span className="text-lg font-semibold">Centri Admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item, index) => {
                    const isActive = pathname === item.href;
                    // Add separators between tiers:
                    // After Tier 1 (after index 2, before index 3)
                    // After Tier 2 (after index 3, before index 4)
                    // After Tier 3 (after index 4, before index 5)
                    const showSeparator = index === 3 || index === 4 || index === 5;
                    
                    return (
                        <div key={item.name}>
                            {showSeparator && <div className="h-px bg-border my-2 mx-2" />}
                            <Link
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
                        </div>
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
