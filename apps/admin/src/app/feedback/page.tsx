'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MessageSquare, Bug, Lightbulb, Wrench, HelpCircle,
    Star, RefreshCw, Check, Eye, Archive, Trash2,
    ChevronDown, Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface Feedback {
    id: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    type: string;
    message: string;
    page?: string;
    rating?: number;
    status: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
}

interface FeedbackStats {
    total: number;
    new: number;
    reviewed: number;
    resolved: number;
    byType: Record<string, number>;
}

const TYPE_CONFIG = {
    bug: { icon: Bug, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Bug Report' },
    feature: { icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Feature Request' },
    improvement: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Improvement' },
    other: { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Other' },
};

const STATUS_CONFIG = {
    new: { color: 'bg-blue-500', label: 'New' },
    reviewed: { color: 'bg-amber-500', label: 'Reviewed' },
    resolved: { color: 'bg-emerald-500', label: 'Resolved' },
    archived: { color: 'bg-gray-500', label: 'Archived' },
};

export default function FeedbackPage() {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (typeFilter) params.append('type', typeFilter);

            const [feedbackRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/feedback?${params.toString()}`),
                fetch(`${API_URL}/feedback/stats`),
            ]);

            if (feedbackRes.ok) {
                const data = await feedbackRes.json();
                setFeedbackList(data.items || data || []);
            } else {
                console.error('Failed to fetch feedback:', feedbackRes.status, await feedbackRes.text());
            }
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            } else {
                console.error('Failed to fetch stats:', statsRes.status);
            }
        } catch (e) {
            console.error('Error fetching feedback:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [statusFilter, typeFilter]);

    const updateStatus = async (id: string, status: string) => {
        try {
            await fetch(`${API_URL}/feedback/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes }),
            });
            fetchFeedback();
            setSelectedFeedback(null);
            setAdminNotes('');
        } catch (e) {
            console.error('Error updating status:', e);
        }
    };

    const deleteFeedback = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await fetch(`${API_URL}/feedback/${id}`, { method: 'DELETE' });
            fetchFeedback();
        } catch (e) {
            console.error('Error deleting feedback:', e);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Feedback</h1>
                    <p className="text-muted-foreground">
                        Review and manage feedback submitted by users.
                    </p>
                </div>
                <Button onClick={fetchFeedback} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Total Feedback</div>
                            <div className="text-3xl font-bold">{stats?.total || feedbackList.length || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                            <div className="text-sm text-blue-600 dark:text-blue-400">New</div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.new || feedbackList.filter(f => f.status === 'new').length || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 dark:border-amber-800">
                        <CardContent className="p-4">
                            <div className="text-sm text-amber-600 dark:text-amber-400">Reviewed</div>
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats?.reviewed || feedbackList.filter(f => f.status === 'reviewed').length || 0}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 dark:border-emerald-800">
                        <CardContent className="p-4">
                            <div className="text-sm text-emerald-600 dark:text-emerald-400">Resolved</div>
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.resolved || feedbackList.filter(f => f.status === 'resolved').length || 0}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filters:</span>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-background text-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-background text-sm"
                >
                    <option value="">All Types</option>
                    <option value="bug">Bug Reports</option>
                    <option value="feature">Feature Requests</option>
                    <option value="improvement">Improvements</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading feedback...</div>
                ) : feedbackList.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-muted/50">
                                    <MessageSquare className="w-12 h-12 text-muted-foreground/50" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">No feedback yet</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Feedback submitted by users from the main app will appear here. 
                                        Users can submit feedback through the feedback form or contact forms.
                                    </p>
                                </div>
                                {statusFilter || typeFilter ? (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setStatusFilter('');
                                            setTypeFilter('');
                                        }}
                                        className="mt-2"
                                    >
                                        Clear Filters
                                    </Button>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    feedbackList.map((feedback) => {
                        const typeConfig = TYPE_CONFIG[feedback.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.other;
                        const statusConfig = STATUS_CONFIG[feedback.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;
                        const TypeIcon = typeConfig.icon;

                        return (
                            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Type Icon */}
                                        <div className={`p-3 rounded-lg ${typeConfig.bg}`}>
                                            <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-semibold">{typeConfig.label}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                                {feedback.rating && (
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`w-3 h-3 ${star <= feedback.rating!
                                                                        ? 'text-amber-400 fill-amber-400'
                                                                        : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-foreground mb-3 whitespace-pre-wrap">
                                                {feedback.message}
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                <span>
                                                    From: {feedback.userName || feedback.userEmail || 'Anonymous'}
                                                </span>
                                                {feedback.page && (
                                                    <span>Page: {feedback.page}</span>
                                                )}
                                                <span>
                                                    {format(new Date(feedback.createdAt), 'MMM d, yyyy h:mm a')}
                                                </span>
                                            </div>

                                            {feedback.adminNotes && (
                                                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                                    <span className="text-xs font-medium text-muted-foreground">Admin Notes:</span>
                                                    <p className="text-sm mt-1">{feedback.adminNotes}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {feedback.status === 'new' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStatus(feedback.id, 'reviewed')}
                                                    className="gap-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Mark Reviewed
                                                </Button>
                                            )}
                                            {feedback.status === 'reviewed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStatus(feedback.id, 'resolved')}
                                                    className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    Resolve
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => updateStatus(feedback.id, 'archived')}
                                                className="text-muted-foreground"
                                            >
                                                <Archive className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteFeedback(feedback.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
