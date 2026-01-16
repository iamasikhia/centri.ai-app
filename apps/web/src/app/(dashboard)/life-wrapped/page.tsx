'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { Clock, Users, CheckCircle2, MessageSquare, Box, Zap, Sparkles, Calendar, ChevronDown, Loader2 } from 'lucide-react';

type Period = 'week' | 'month' | 'year';

interface WrappedData {
    period: string;
    timeOverview: {
        meetingHours: number;
        meetingCount: number;
        avgMeetingLengthMinutes: number;
        focusPercentage: number;
    };
    meetingsBreakdown: {
        oneOnOne: number;
        team: number;
        stakeholder: number;
        longestMeeting: string;
        insight: string;
    };
    work: {
        completed: number;
        created: number;
        actionItems: number;
        copy: string;
    };
    collaboration: {
        activeChannels: number;
        stakeholders: number;
        slackSent: number;
        copy: string;
    };
    product: {
        decisions: number;
        features: number;
        releases: number;
        docs: number;
        copy: string;
    };
    focus: {
        busiestDay: string;
        leastProductiveDay: string;
        peakMeetingTime: string;
    };
    aiReflection: string;
}

export default function LifeWrappedPage() {
    const [period, setPeriod] = useState<Period>('week');
    const [data, setData] = useState<WrappedData | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset scroll when period changes
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [period]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                // Use default user ID or real one if available
                const res = await axios.get(`${API_URL}/reports/wrapped?period=${period}`, {
                    headers: { 'x-user-id': 'default-user-id' }
                });
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch wrapped data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [period]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] w-full bg-black text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-500" />
                    <p className="text-xl font-light text-white/60 animate-pulse">Generating your report...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-black text-white rounded-xl shadow-2xl">

            {/* Top Navigation */}
            <div className="absolute top-6 left-0 right-0 z-50 flex justify-center">
                <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10">
                    {(['week', 'month', 'year'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all capitalize",
                                period === p
                                    ? "bg-white text-black shadow-lg scale-105"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                        >
                            This {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scroll Container */}
            <div
                ref={containerRef}
                className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar"
            >
                {/* 0. Intro */}
                <Section className="bg-gradient-to-br from-violet-900 to-black">
                    <Confetti />
                    <div className="text-center animate-in zoom-in duration-1000 fade-in slide-in-from-bottom-10">
                        <Sparkles className="w-24 h-24 mx-auto text-yellow-300 mb-6 animate-pulse" />
                        <h1 className="text-7xl font-black tracking-tighter mb-4">
                            Work <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Wrapped</span>
                        </h1>
                        <p className="text-2xl text-white/70 font-light">
                            Your professional journey {data.period.toLowerCase()}.
                        </p>
                        <div className="mt-12 animate-bounce">
                            <ChevronDown className="w-8 h-8 mx-auto text-white/50" />
                        </div>
                    </div>
                </Section>

                {/* 1. Time Overview */}
                <Section className="bg-gradient-to-br from-blue-900 to-slate-900">
                    <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-200 text-sm font-bold uppercase tracking-wider">
                                <Clock className="w-4 h-4" /> Time Overview
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black leading-tight">
                                {data.timeOverview.meetingHours} hours <br />
                                <span className="text-blue-400">in meetings.</span>
                            </h2>
                            <p className="text-xl text-blue-100/60 leading-relaxed max-w-md">
                                That's {data.timeOverview.meetingCount} separate calls.
                                Your average meeting was {data.timeOverview.avgMeetingLengthMinutes} minutes long.
                            </p>
                        </div>
                        <div className="aspect-square bg-blue-500/10 rounded-full flex items-center justify-center border-4 border-blue-500/30 relative">
                            <div className="text-center">
                                <div className="text-6xl font-bold">{data.timeOverview.focusPercentage}%</div>
                                <div className="text-blue-200 uppercase tracking-widest mt-2 font-medium">Focus Time</div>
                            </div>
                            {/* Decorative rings */}
                            <div className="absolute inset-0 rounded-full border border-blue-400/20 scale-110" />
                            <div className="absolute inset-0 rounded-full border border-blue-400/10 scale-125" />
                        </div>
                    </div>
                </Section>

                {/* 2. Meetings Breakdown */}
                <Section className="bg-gradient-to-br from-emerald-900 to-black">
                    <div className="w-full max-w-5xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-200 text-sm font-bold uppercase tracking-wider mb-8">
                            <Users className="w-4 h-4" /> Meeting DNA
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <StatCard
                                label="1:1s"
                                value={data.meetingsBreakdown.oneOnOne}
                                color="bg-emerald-500"
                            />
                            <StatCard
                                label="Team Syncs"
                                value={data.meetingsBreakdown.team}
                                color="bg-teal-500"
                            />
                            <StatCard
                                label="Stakeholders"
                                value={data.meetingsBreakdown.stakeholder}
                                color="bg-green-500"
                            />
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="text-sm text-white/50 uppercase tracking-wider mb-1">Longest Marathon</div>
                                <div className="text-2xl font-bold">{data.meetingsBreakdown.longestMeeting}</div>
                            </div>
                            <p className="text-2xl text-emerald-200/80 italic font-light">
                                "{data.meetingsBreakdown.insight}"
                            </p>
                        </div>
                    </div>
                </Section>

                {/* 3. Work & Execution */}
                <Section className="bg-gradient-to-br from-orange-900 to-red-950">
                    <div className="text-center max-w-3xl">
                        <CheckCircle2 className="w-20 h-20 text-orange-400 mx-auto mb-8 animate-bounce transition-all duration-1000" />
                        <h2 className="text-6xl font-black mb-8">
                            {data.work.completed} Tasks <span className="text-orange-400">Crushed.</span>
                        </h2>

                        <div className="grid grid-cols-2 gap-8 text-left bg-white/5 p-8 rounded-3xl border border-white/10">
                            <div>
                                <div className="text-4xl font-bold mb-2">{data.work.created}</div>
                                <div className="text-orange-200">New Tasks Created</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2">{data.work.actionItems}</div>
                                <div className="text-orange-200">Action Items Generated</div>
                            </div>
                        </div>
                        <p className="text-xl text-orange-100/70 mt-8">
                            {data.work.copy}
                        </p>
                    </div>
                </Section>

                {/* 4. Collaboration */}
                <Section className="bg-gradient-to-br from-fuchsia-900 to-purple-950">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center w-full max-w-5xl">
                        <div className="order-2 md:order-1">
                            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-full aspect-square flex items-center justify-center flex-col shadow-2xl border border-white/20">
                                <MessageSquare className="w-16 h-16 text-fuchsia-300 mb-4" />
                                <div className="text-6xl font-black">{data.collaboration.slackSent}</div>
                                <div className="text-fuchsia-200 font-medium">Messages Sent</div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 space-y-6">
                            <h2 className="text-5xl font-bold leading-tight">
                                The <span className="text-fuchsia-400">Connector.</span>
                            </h2>
                            <p className="text-2xl text-fuchsia-100/80">
                                {data.collaboration.copy}
                            </p>
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-4 text-xl">
                                    <span className="w-12 font-bold text-fuchsia-400">{data.collaboration.activeChannels}</span>
                                    <span>Active Channels</span>
                                </div>
                                <div className="flex items-center gap-4 text-xl">
                                    <span className="w-12 font-bold text-fuchsia-400">{data.collaboration.stakeholders}</span>
                                    <span>Key Stakeholders</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 5. Product */}
                <Section className="bg-gradient-to-br from-indigo-900 to-slate-950">
                    <div className="max-w-4xl w-full text-center">
                        <Box className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                        <h2 className="text-4xl md:text-5xl font-bold mb-12">Building the Future</h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ProductCard label="Decisions" value={data.product.decisions} />
                            <ProductCard label="Features" value={data.product.features} />
                            <ProductCard label="Releases" value={data.product.releases} />
                            <ProductCard label="Docs" value={data.product.docs} />
                        </div>

                        <div className="mt-12 p-6 bg-indigo-500/20 rounded-xl border border-indigo-500/30 inline-block">
                            <p className="text-xl text-indigo-100">"{data.product.copy}"</p>
                        </div>
                    </div>
                </Section>

                {/* 6. Focus Patterns */}
                <Section className="bg-zinc-950 relative overflow-hidden">
                    {/* Background Noise/Grid */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                    <div className="relative z-10 max-w-4xl w-full">
                        <h2 className="text-4xl font-bold mb-12 flex items-center gap-4">
                            <Zap className="w-8 h-8 text-yellow-400" /> Focus Patterns
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/5 border-l-4 border-red-500 p-6 rounded-r-xl">
                                <div className="text-sm text-red-400 uppercase tracking-widest mb-2 font-bold">Chaos Mode</div>
                                <div className="text-3xl font-bold mb-1">{data.focus.busiestDay}s</div>
                                <div className="text-white/60">Most overlapping meetings</div>
                            </div>

                            <div className="bg-white/5 border-l-4 border-green-500 p-6 rounded-r-xl">
                                <div className="text-sm text-green-400 uppercase tracking-widest mb-2 font-bold">Deep Work</div>
                                <div className="text-3xl font-bold mb-1">{data.focus.leastProductiveDay === 'Friday' ? 'Mondays' : 'Fridays'}</div>
                                <div className="text-white/60">Best uninterrupted blocks</div>
                            </div>

                            <div className="bg-white/5 border-l-4 border-yellow-500 p-6 rounded-r-xl md:col-span-2">
                                <div className="text-sm text-yellow-400 uppercase tracking-widest mb-2 font-bold">Peak Intensity</div>
                                <div className="text-3xl font-bold mb-1">{data.focus.peakMeetingTime}</div>
                                <div className="text-white/60">When you are most likely to be unavailable</div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 7. AI Summary */}
                <Section className="bg-gradient-to-b from-slate-900 to-black">
                    <div className="max-w-3xl w-full text-center space-y-8">
                        <div className="inline-block p-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-3xl text-violet-200 font-medium">AI Reflection</h2>

                        <div className="text-3xl md:text-5xl font-serif italic leading-relaxed text-white/90">
                            "{data.aiReflection}"
                        </div>

                        <div className="pt-12">
                            <button className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                                Share Summary
                            </button>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
}



function Confetti() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "absolute top-[-20px] w-3 h-3 rounded-full animate-fall",
                        i % 3 === 0 ? "bg-red-500" : i % 3 === 1 ? "bg-blue-500" : "bg-yellow-400"
                    )}
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 3 + 2}s`,
                        animationDelay: `${Math.random() * 2}s`,
                        opacity: Math.random()
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
}

// Sub-components

function Section({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <section className={cn(
            "h-full w-full snap-start flex items-center justify-center p-8 relative overflow-hidden",
            className
        )}>

            {children}
        </section>
    );
}
//...

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
            <div className={cn("text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50")}>
                {value}
            </div>
            <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-sm uppercase tracking-wide font-medium text-white/70">{label}</span>
            </div>
        </div>
    );
}

function ProductCard({ label, value }: { label: string, value: number }) {
    return (
        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
            <div className="text-4xl font-bold text-indigo-300 mb-2">{value}</div>
            <div className="text-xs uppercase tracking-widest text-indigo-100/50">{label}</div>
        </div>
    );
}
