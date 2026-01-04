'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Play, Check, Clock, Hash, MessageCircle } from "lucide-react";

interface ScheduledQuestion {
    id: string;
    title: string;
    text: string;
    targetType: 'channel' | 'dm';
    targetId: string | null;
    frequency: 'daily' | 'weekly' | 'once' | 'always_test';
    timeOfDay: string;
    lastSentAt: string | null;
    createdAt: string;
}

interface Channel {
    id: string;
    name: string;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<ScheduledQuestion[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [targetType, setTargetType] = useState<'channel' | 'dm'>('channel');
    const [targetId, setTargetId] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [timeOfDay, setTimeOfDay] = useState('09:00');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Channels
            const channelsRes = await fetch('http://localhost:3001/slack/channels', {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (channelsRes.ok) {
                const data = await channelsRes.json();
                setChannels(data.channels || []);
            }

            // Fetch Questions
            const questionsRes = await fetch('http://localhost:3001/slack/questions', {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (questionsRes.ok) {
                const data = await questionsRes.json();
                setQuestions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/slack/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id'
                },
                body: JSON.stringify({
                    title, text, targetType, targetId, frequency, timeOfDay
                })
            });
            if (res.ok) {
                setIsCreating(false);
                setTitle(''); setText('');
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`http://localhost:3001/slack/questions/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default-user-id' }
            });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleRunNow = async () => {
        try {
            const res = await fetch('http://localhost:3001/slack/questions/run', {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
            const data = await res.json();
            alert(`Run complete. Sent: ${data.sent}`);
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Failed to run');
        }
    };

    if (loading && questions.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Scheduled Check-ins</h2>
                    <p className="text-muted-foreground">Automate detailed check-ins with your team on Slack.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRunNow}
                        className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors"
                    >
                        <Play className="w-4 h-4" /> Run Check
                    </button>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Question
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {isCreating && (
                <Card className="border-primary/20 bg-slate-50/50">
                    <CardHeader>
                        <CardTitle>Create New Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Internal Title</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-md"
                                        placeholder="e.g. Daily Standup"
                                        value={title} onChange={e => setTitle(e.target.value)} required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Frequency</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md bg-white"
                                        value={frequency} onChange={e => setFrequency(e.target.value)}
                                    >
                                        <option value="daily">Daily (Every Morning)</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="once">Once</option>
                                        <option value="always_test">Always (Test Mode)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Question Text</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                                    placeholder="What did you work on yesterday? What are you working on today?"
                                    value={text} onChange={e => setText(e.target.value)} required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Post To</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md bg-white"
                                        value={targetId} onChange={e => setTargetId(e.target.value)} required
                                    >
                                        <option value="">Select a Channel...</option>
                                        {channels.map(c => (
                                            <option key={c.id} value={c.id}>#{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Time (Approx)</label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2 border rounded-md"
                                        value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 hover:underline">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-md">Save Schedule</button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {questions.length === 0 && !isCreating && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium">No scheduled questions yet</h3>
                        <p className="text-muted-foreground mb-4">Create one to start asking your team automatically.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-primary font-medium hover:underline"
                        >
                            Create Question
                        </button>
                    </div>
                )}

                {questions.map(q => (
                    <Card key={q.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-lg">{q.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-1 bg-slate-100 rounded uppercase font-medium text-slate-500">{q.frequency}</span>
                                        <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:text-red-600 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-muted-foreground mb-3">{q.text}</p>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Hash className="w-3 h-3" />
                                        <span>
                                            {channels.find(c => c.id === q.targetId)?.name || 'Unknown Channel'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{q.timeOfDay}</span>
                                    </div>
                                    {q.lastSentAt && (
                                        <div className="text-xs text-green-600">
                                            Last sent: {new Date(q.lastSentAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
