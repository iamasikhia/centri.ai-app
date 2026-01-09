
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { NotificationsList, UpdateItem } from '@/components/dashboard/notifications-list';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCheck, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
    const [updates, setUpdates] = useState<UpdateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/updates`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            setUpdates(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/updates/refresh`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.data.items) {
                setUpdates(res.data.items);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        // Optimistic update
        setUpdates(prev => prev.map(u => u.id === id ? { ...u, isRead: true } : u));
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/updates/${id}/read`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (e) { }
    };

    const handleDismiss = async (id: string) => {
        // Optimistic update
        setUpdates(prev => prev.filter(u => u.id !== id));
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/updates/${id}/dismiss`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (e) { }
    };

    const markAllRead = async () => {
        const unreadIds = updates.filter(u => !u.isRead).map(u => u.id);
        if (unreadIds.length === 0) return;

        // Optimistic
        setUpdates(prev => prev.map(u => ({ ...u, isRead: true })));

        try {
            await Promise.all(unreadIds.map(id =>
                axios.post(`${process.env.NEXT_PUBLIC_API_URL}/updates/${id}/read`, {}, {
                    headers: { 'x-user-id': 'default-user-id' }
                })
            ));
        } catch (e) { }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-1">
                        Stay updated with your latest emails, tasks, and team activity.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={markAllRead} disabled={loading || updates.every(u => u.isRead)}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark all read
                    </Button>
                    <Button onClick={handleRefresh} disabled={refreshing || loading}>
                        {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : (
                <NotificationsList
                    updates={updates}
                    onMarkRead={handleMarkRead}
                    onDismiss={handleDismiss}
                />
            )}
        </div>
    );
}
