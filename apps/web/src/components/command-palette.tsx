'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
    Home, Mic, BookOpen, CheckSquare, CalendarCheck, Briefcase,
    Settings, Zap, Mail, Sparkles, Search, MessageCircle, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
    id: string;
    label: string;
    icon: any;
    href?: string;
    action?: () => void;
    keywords?: string[];
}

const navigationItems: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard', keywords: ['home', 'overview'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/notifications', keywords: ['alerts', 'updates'] },
    { id: 'meetings', label: 'Meetings', icon: Mic, href: '/meetings', keywords: ['calls', 'transcripts', 'sync'] },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle, href: '/chat', keywords: ['assistant', 'ai', 'help'] },
    { id: 'codebase', label: 'Codebase Intelligence', icon: BookOpen, href: '/codebase-overview', keywords: ['code', 'github', 'repo', 'analysis'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: '/todos', keywords: ['todo', 'work', 'items'] },
    { id: 'checkins', label: 'CheckIns', icon: CalendarCheck, href: '/questions', keywords: ['slack', 'standup', 'daily'] },
    { id: 'stakeholders', label: 'Stakeholders', icon: Briefcase, href: '/stakeholders', keywords: ['contacts', 'people', 'relationships'] },
    { id: 'wrapped', label: 'Work Wrapped', icon: Sparkles, href: '/life-wrapped', keywords: ['summary', 'recap', 'year'] },
    { id: 'integrations', label: 'Integrations', icon: Zap, href: '/settings/integrations', keywords: ['connect', 'apps', 'google', 'slack'] },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', keywords: ['preferences', 'account'] },
    { id: 'contact', label: 'Contact Support', icon: Mail, href: '/contact', keywords: ['help', 'support', 'feedback'] },
];

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const router = useRouter();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Filter items based on search
    const filteredItems = React.useMemo(() => {
        if (!search.trim()) return navigationItems;
        const query = search.toLowerCase();
        return navigationItems.filter(item =>
            item.label.toLowerCase().includes(query) ||
            item.keywords?.some(k => k.includes(query))
        );
    }, [search]);

    // Keyboard shortcut to open
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Reset state when opening
    React.useEffect(() => {
        if (open) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = filteredItems[selectedIndex];
            if (item) {
                if (item.href) {
                    router.push(item.href);
                } else if (item.action) {
                    item.action();
                }
                setOpen(false);
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden p-0 max-w-lg">
                <div className="flex items-center border-b px-4">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        className="flex-1 h-12 px-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                        placeholder="Search pages, features..."
                    />
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ESC
                    </kbd>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                    {filteredItems.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No results found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredItems.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (item.href) {
                                            router.push(item.href);
                                        } else if (item.action) {
                                            item.action();
                                        }
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                                        index === selectedIndex
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.keywords && item.keywords.length > 0 && (
                                        <span className={cn(
                                            "text-xs",
                                            index === selectedIndex ? "text-primary-foreground/70" : "text-muted-foreground"
                                        )}>
                                            {item.keywords[0]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">↑↓</kbd>
                        <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Enter</kbd>
                        <span>Select</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">⌘K</kbd>
                        <span>Toggle</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
