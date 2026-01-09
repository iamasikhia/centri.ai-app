
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { NotificationsList, UpdateItem } from '@/components/dashboard/notifications-list';
import { cn } from '@/lib/utils';

export function NotificationsSheet() {
    const [open, setOpen] = useState(false);
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Poll for unread count
    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await axios.get(`${API_URL}/updates`, {
                    headers: { 'x-user-id': 'default-user-id' }
                });
                if (res.data) {
                    setUpdates(res.data);
                    setUnreadCount(res.data.filter((u: any) => !u.isRead).length);
                }
            } catch (e) { }
        };

        fetchUpdates();
        const interval = setInterval(fetchUpdates, 10000); // 10s polling
        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = async (id: string) => {
        setUpdates(prev => prev.map(u => u.id === id ? { ...u, isRead: true } : u));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/updates/${id}/read`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (e) { }
    };

    const handleDismiss = async (id: string) => {
        setUpdates(prev => prev.filter(u => u.id !== id));
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/updates/${id}/dismiss`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (e) { }
    };

    const markAllRead = async () => {
        const unreadIds = updates.filter(u => !u.isRead).map(u => u.id);
        if (unreadIds.length === 0) return;

        setUpdates(prev => prev.map(u => ({ ...u, isRead: true })));
        setUnreadCount(0);

        try {
            await Promise.all(unreadIds.map(id =>
                axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/updates/${id}/read`, {}, {
                    headers: { 'x-user-id': 'default-user-id' }
                })
            ));
        } catch (e) { }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    className={cn(
                        "fixed top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
                        unreadCount > 0
                            ? "bg-white text-foreground border-2 border-red-500 shadow-red-500/20"
                            : "bg-white dark:bg-zinc-900 border text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Bell className={cn("w-5 h-5", unreadCount > 0 && "text-red-500")} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-background/95 backdrop-blur-xl border-l">
                <SheetHeader className="flex-none pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {unreadCount} new
                                </span>
                            )}
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-8 text-xs">
                                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6 py-6">
                    <NotificationsList
                        updates={updates}
                        onMarkRead={handleMarkRead}
                        onDismiss={handleDismiss}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
