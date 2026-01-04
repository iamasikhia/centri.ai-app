'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Users, Settings, LogOut, MessageCircle, CalendarCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/', redirect: true });
    };

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/chat', label: 'Chat', icon: MessageCircle },
        { href: '/questions', label: 'Schedule Checkins', icon: CalendarCheck },
        { href: '/team', label: 'Team', icon: Users },
        { href: '/settings/integrations', label: 'Integrations', icon: Settings },
    ];

    return (
        <div className="w-64 border-r bg-card flex flex-col h-full">
            <div className="p-6 flex items-center gap-3">
                <Image src="/logo.png" alt="Centri.ai" width={32} height={32} className="rounded" />
                <h1 className="text-xl font-bold tracking-tight">Centri.ai</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <link.icon className="w-4 h-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t">
                <div className="flex items-center justifying-between w-full">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
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
    );
}
