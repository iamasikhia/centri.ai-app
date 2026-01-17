
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Users, Settings, LogOut, MessageCircle, CalendarCheck, Bell, Zap, Wrench, CheckSquare, Briefcase, Mic, Rocket, Sparkles, BookOpen, Newspaper, Moon, Sun, Search, Target, Loader2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { useState, useEffect, useTransition } from 'react';
import axios from 'axios';
import { useTeamMode } from '@/contexts/team-mode-context';


export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
    const [unreadCount, setUnreadCount] = useState(0);
    const { hasEngineeringTeam } = useTeamMode();
    const [usesSlack, setUsesSlack] = useState(true); // Default to true, update from localStorage
    const [isPending, startTransition] = useTransition();
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    // Reset navigatingTo when pathname changes (navigation complete)
    useEffect(() => {
        setNavigatingTo(null);
    }, [pathname]);

    // Check if user uses Slack from localStorage or integrations
    useEffect(() => {
        const checkSlackIntegration = () => {
            // Check localStorage first (from onboarding)
            const storedUsesSlack = localStorage.getItem('uses_slack');
            if (storedUsesSlack !== null) {
                setUsesSlack(storedUsesSlack === 'true');
                return;
            }

            // Fallback: check selected integrations
            const selectedIntegrations = localStorage.getItem('selected_integrations');
            if (selectedIntegrations) {
                const integrations = JSON.parse(selectedIntegrations);
                setUsesSlack(integrations.includes('slack'));
            }
        };

        checkSlackIntegration();

        // Listen for storage changes (in case user updates in another tab)
        window.addEventListener('storage', checkSlackIntegration);
        return () => window.removeEventListener('storage', checkSlackIntegration);
    }, []);

    // Poll for notifications
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await axios.get(`${API_URL}/updates`, {
                    headers: { 'x-user-id': 'default-user-id' }
                });
                if (res.data) {
                    const count = res.data.filter((u: any) => !u.isRead).length;
                    setUnreadCount(count);
                }
            } catch (e) {
                // Silent error
            }
        };

        fetchUnread(); // Initial
        const interval = setInterval(fetchUnread, 10000); // Every 10s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        // Clear onboarding flag so it triggers on next login
        localStorage.removeItem('onboarding_complete');
        localStorage.removeItem('user_goals');
        localStorage.removeItem('selected_integrations');
        localStorage.removeItem('has_engineering_team');
        localStorage.removeItem('uses_slack');
        await signOut({ callbackUrl: '/', redirect: true });
    };

    // Engineering-related items are marked with isEngineering: true
    // Slack-dependent items are marked with requiresSlack: true
    const allMainLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/meetings', label: 'Meetings', icon: Mic },
        { href: '/codebase-overview', label: 'Codebase Intelligence', icon: BookOpen, isEngineering: true },
        { href: '/todos', label: 'Tasks', icon: CheckSquare },
        { href: '/questions', label: 'CheckIns', icon: CalendarCheck, requiresSlack: true },
        { href: '/stakeholders', label: 'Stakeholders', icon: Briefcase },
    ];

    // Filter out engineering items if user doesn't have an engineering team
    // Filter out Slack-dependent items if user doesn't use Slack
    const mainLinks = allMainLinks.filter(link => {
        if (link.isEngineering && !hasEngineeringTeam) return false;
        if (link.requiresSlack && !usesSlack) return false;
        return true;
    });

    const footerLinks = [
        { href: '/life-wrapped', label: 'Work Wrapped', icon: Sparkles },
        { href: '/settings/integrations', label: 'Integrations', icon: Zap },
        { href: '/settings', label: 'Settings', icon: Settings },
    ];

    const renderLink = (link: typeof mainLinks[0]) => {
        // Check if a more specific sidebar link is currently active (e.g. /settings/integrations vs /settings)
        const allLinks = [...mainLinks, ...footerLinks];
        const isOverridden = allLinks.some(other =>
            other.href !== link.href &&
            other.href.startsWith(link.href) &&
            pathname?.startsWith(other.href)
        );

        const isActive = !isOverridden && (pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href)));
        const isNavigating = navigatingTo === link.href;

        const handleClick = (e: React.MouseEvent) => {
            if (pathname !== link.href) {
                setNavigatingTo(link.href);
                startTransition(() => {
                    router.push(link.href);
                });
            }
        };

        return (
            <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={handleClick}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150",
                    isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isNavigating
                            ? "bg-accent/70 text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
            >
                {isNavigating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <link.icon className="w-4 h-4" />
                )}
                {link.label}
            </Link>
        );
    };

    return (
        <div className="w-64 border-r bg-card flex flex-col h-full">
            <div className="p-6 flex items-center gap-3">
                <Image src="/logo.png" alt="Centri.ai" width={32} height={32} className="rounded" />
                <h1 className="text-xl font-bold tracking-tight">Centri.ai</h1>
            </div>

            {/* Quick Search Hint */}
            <div className="px-4 mb-2">
                <button
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                        document.dispatchEvent(event);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                    <Search className="w-4 h-4" />
                    <span className="flex-1 text-left">Quick search...</span>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
                        ⌘K
                    </kbd>
                </button>
            </div>

            <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto">
                <div className="space-y-1">
                    {mainLinks.map(renderLink)}
                </div>

                <div className="mt-auto pt-4">
                    <div className="mx-2 mb-4 border-t" />
                    <div className="space-y-1">
                        {footerLinks.map(renderLink)}
                    </div>
                </div>
            </nav>
            <div className="p-4">
                <div className="flex items-center justifying-between w-full">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                            {session?.user?.image && (
                                <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="text-sm">
                            <div className="font-medium">{session?.user?.name || 'User'}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {session?.user?.email || 'Manager'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                            title="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                            title="Log out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
