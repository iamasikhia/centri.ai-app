'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Puzzle, RefreshCw, Check, Eye, Archive, Trash2,
    Filter, Clock, CheckCircle, XCircle, Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';

// Integration name mappings
const INTEGRATION_NAMES: Record<string, string> = {
    // Project Management
    jira: 'Jira',
    asana: 'Asana',
    trello: 'Trello',
    monday: 'Monday.com',
    linear: 'Linear',
    clickup: 'ClickUp',
    // Communication
    microsoft_teams: 'Microsoft Teams',
    discord: 'Discord',
    intercom: 'Intercom',
    // CRM & Sales
    salesforce: 'Salesforce',
    hubspot: 'HubSpot',
    pipedrive: 'Pipedrive',
    // Developer Tools
    gitlab: 'GitLab',
    bitbucket: 'Bitbucket',
    figma: 'Figma',
    // Analytics
    mixpanel: 'Mixpanel',
    amplitude: 'Amplitude',
    google_analytics: 'Google Analytics',
    // HR & Finance
    gusto: 'Gusto',
    quickbooks: 'QuickBooks',
    // Cloud
    aws: 'AWS',
    gcp: 'Google Cloud',
    azure: 'Microsoft Azure',
};

interface IntegrationRequest {
    id: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    integrationIds: string[];
    status: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    total: number;
    pending: number;
    underReview: number;
    planned: number;
    completed: number;
    topRequested: Array<{ id: string; count: number }>;
}

const STATUS_CONFIG = {
    pending: { color: 'bg-blue-500', label: 'Pending', icon: Clock },
    under_review: { color: 'bg-amber-500', label: 'Under Review', icon: Eye },
    planned: { color: 'bg-purple-500', label: 'Planned', icon: Lightbulb },
    completed: { color: 'bg-emerald-500', label: 'Completed', icon: CheckCircle },
    declined: { color: 'bg-red-500', label: 'Declined', icon: XCircle },
};

export default function IntegrationRequestsPage() {
    const [requests, setRequests] = useState<IntegrationRequest[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            try {
                const [requestsRes, statsRes] = await Promise.all([
                    fetch(`${API_URL}/integration-requests?${params.toString()}`),
                    fetch(`${API_URL}/integration-requests/stats`),
                ]);

                if (requestsRes.ok) {
                    const data = await requestsRes.json();
                    setRequests(data.items || []);
                } else {
                    setRequests([]);
                }

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                } else {
                    setStats({
                        total: 0,
                        pending: 0,
                        underReview: 0,
                        planned: 0,
                        completed: 0,
                        topRequested: []
                    });
                }
            } catch (err) {
                console.error("API fetch failed", err);
                setRequests([]);
                setStats({
                    total: 0,
                    pending: 0,
                    underReview: 0,
                    planned: 0,
                    completed: 0,
                    topRequested: []
                });
            }

        } catch (e) {
            console.error('Error fetching integration requests:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const updateStatus = async (id: string, status: string) => {
        try {
            await fetch(`${API_URL}/integration-requests/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            fetchData();
        } catch (e) {
            console.error('Error updating status:', e);
        }
    };

    const deleteRequest = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        try {
            await fetch(`${API_URL}/integration-requests/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (e) {
            console.error('Error deleting request:', e);
        }
    };

    const getIntegrationName = (id: string) => INTEGRATION_NAMES[id] || id;

    return (
        <div className="flex flex-col gap-6 p-8 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Integration Requests</h1>
                    <p className="text-muted-foreground">
                        Track which integrations users want to see added.
                    </p>
                </div>
                <Button onClick={fetchData} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">Total Requests</div>
                            <div className="text-3xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                            <div className="text-sm text-blue-600 dark:text-blue-400">Pending</div>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 dark:border-amber-800">
                        <CardContent className="p-4">
                            <div className="text-sm text-amber-600 dark:text-amber-400">Under Review</div>
                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.underReview}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-purple-200 dark:border-purple-800">
                        <CardContent className="p-4">
                            <div className="text-sm text-purple-600 dark:text-purple-400">Planned</div>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.planned}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 dark:border-emerald-800">
                        <CardContent className="p-4">
                            <div className="text-sm text-emerald-600 dark:text-emerald-400">Completed</div>
                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Most Requested */}
            {stats && stats.topRequested.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Most Requested Integrations</h3>
                        <div className="flex flex-wrap gap-3">
                            {stats.topRequested.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                                >
                                    <Puzzle className="w-4 h-4 text-primary" />
                                    <span className="font-medium">{getIntegrationName(item.id)}</span>
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                        {item.count} requests
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-md border bg-background text-sm"
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="planned">Planned</option>
                    <option value="completed">Completed</option>
                    <option value="declined">Declined</option>
                </select>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Puzzle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">No integration requests yet</h3>
                            <p className="text-muted-foreground">
                                User integration requests will appear here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((request) => {
                        const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                        const StatusIcon = statusConfig.icon;

                        return (
                            <Card key={request.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="p-3 rounded-lg bg-primary/10">
                                            <Puzzle className="w-5 h-5 text-primary" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig.label}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                                                </span>
                                            </div>

                                            <div className="font-medium mb-2">
                                                Requested by: {request.userName || request.userEmail || 'Anonymous User'}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {request.integrationIds.map((id) => (
                                                    <span
                                                        key={id}
                                                        className="px-3 py-1 rounded-full bg-muted text-sm font-medium"
                                                    >
                                                        {getIntegrationName(id)}
                                                    </span>
                                                ))}
                                            </div>

                                            {request.adminNotes && (
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <span className="text-xs font-medium text-muted-foreground">Admin Notes:</span>
                                                    <p className="text-sm mt-1">{request.adminNotes}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {request.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStatus(request.id, 'under_review')}
                                                    className="gap-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    Review
                                                </Button>
                                            )}
                                            {request.status === 'under_review' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateStatus(request.id, 'planned')}
                                                        className="gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                                                    >
                                                        <Lightbulb className="w-3 h-3" />
                                                        Plan
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateStatus(request.id, 'declined')}
                                                        className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        Decline
                                                    </Button>
                                                </>
                                            )}
                                            {request.status === 'planned' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateStatus(request.id, 'completed')}
                                                    className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    Complete
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteRequest(request.id)}
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
