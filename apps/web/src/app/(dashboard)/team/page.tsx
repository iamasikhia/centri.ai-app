'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, Hash, Mail, Search, Activity } from 'lucide-react';
import { buildDashboardViewModel, DashboardViewModel } from '@/lib/dashboard-utils';
import { TeamHealthView } from '@/components/team-health-view';

interface SlackMember {
    externalId: string;
    name: string;
    email?: string;
    avatarUrl?: string;
}

interface SlackChannel {
    id: string;
    name: string;
    isPrivate: boolean;
    memberCount: number;
    topic?: string;
    purpose?: string;
}

interface SlackData {
    channels: SlackChannel[];
    members: SlackMember[];
}

export default function TeamPage() {
    const [slackData, setSlackData] = useState<SlackData | null>(null);
    const [dashboardVM, setDashboardVM] = useState<DashboardViewModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'health' | 'members' | 'channels'>('health');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = { 'x-user-id': 'default-user-id' };

            // Parallel Fetch
            const [slackRes, dashRes] = await Promise.all([
                fetch('http://localhost:3001/slack/channels', { headers }),
                fetch('http://localhost:3001/dashboard', { headers })
            ]);

            // Handle Slack
            if (slackRes.ok) {
                const sData = await slackRes.json();
                setSlackData(sData);
            } else if (slackRes.status === 404) {
                setSlackData(null);
            }

            // Handle Dashboard (Team Health)
            if (dashRes.ok) {
                const dData = await dashRes.json();
                setDashboardVM(buildDashboardViewModel(dData));
            }

        } catch (e: any) {
            console.error('Failed to fetch data', e);
            setError(e.message || "Network Error");
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = slackData?.members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const filteredChannels = slackData?.channels.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <div className="text-muted-foreground">Loading team data...</div>
            </div>
        );
    }

    // If absolutely no data
    if (!slackData && !dashboardVM) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team</h2>
                    <p className="text-muted-foreground">View your team members and channels</p>
                </div>
                <Card className="p-12 text-center">
                    <div className="text-center">No data available. Please connect integrations.</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team</h2>
                    <p className="text-muted-foreground">
                        {slackData ? `${slackData.members.length} members • ${slackData.channels.length} channels` : 'Team Overview'}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-slate-100 transition-colors"
                    title="Refresh Data"
                >
                    <Users className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('health')}
                    className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'health'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Activity className="w-4 h-4 inline mr-2" />
                    Task Health
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'members'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Members {slackData ? `(${filteredMembers.length})` : ''}
                </button>
                <button
                    onClick={() => setActiveTab('channels')}
                    className={`pb-2 px-1 font-medium transition-colors ${activeTab === 'channels'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Hash className="w-4 h-4 inline mr-2" />
                    Channels {slackData ? `(${filteredChannels.length})` : ''}
                </button>
            </div>

            {/* Health Tab */}
            {activeTab === 'health' && (
                <div className="space-y-4">
                    {dashboardVM ? (
                        <TeamHealthView teamHealth={dashboardVM.teamHealth} />
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">Dashboard data not available.</div>
                    )}
                </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && slackData && (
                <>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMembers.map((member) => (
                            <Card key={member.externalId} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-primary">
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{member.name}</h3>
                                        {member.email && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {filteredMembers.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No members found.</p>}
                    </div>
                </>
            )}

            {/* Channels Tab */}
            {activeTab === 'channels' && slackData && (
                <>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search channels..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredChannels.map((channel) => (
                            <Card key={channel.id} className="p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold text-lg">{channel.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>{channel.memberCount}</span>
                                    </div>
                                </div>
                                {channel.purpose && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {channel.purpose}
                                    </p>
                                )}
                                {channel.isPrivate && (
                                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">
                                        Private
                                    </span>
                                )}
                            </Card>
                        ))}
                        {filteredChannels.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">No channels found.</p>}
                    </div>
                </>
            )}
        </div>
    );
}
