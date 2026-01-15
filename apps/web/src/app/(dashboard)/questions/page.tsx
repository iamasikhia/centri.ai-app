'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Play, Check, Clock, Hash, MessageCircle, Pencil, ChevronDown, ChevronUp, User, RefreshCw } from "lucide-react";
import { toast } from '@/hooks/use-toast';

interface ScheduledQuestion {
    id: string;
    title: string;
    text: string;
    targetType: 'channel' | 'dm';
    targetId: string | null;
    frequency: 'daily' | 'weekly' | 'once' | 'always_test';
    timeOfDay: string;
    lastSentAt: string | null;
    selectedDays?: string[];
    isActive: boolean;
}

interface Channel {
    id: string;
    name: string;
}

interface QuestionResponse {
    id: string;
    slackUser: string;
    text: string;
    createdAt: string;
}

const DAYS = [
    { id: 'Mon', label: 'M' },
    { id: 'Tue', label: 'T' },
    { id: 'Wed', label: 'W' },
    { id: 'Thu', label: 'T' },
    { id: 'Fri', label: 'F' },
    { id: 'Sat', label: 'S' },
    { id: 'Sun', label: 'S' },
];

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<ScheduledQuestion[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [targetType, setTargetType] = useState<'channel' | 'dm'>('channel');
    const [targetId, setTargetId] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [timeOfDay, setTimeOfDay] = useState('09:00');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    // Response Viewer State
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    const [responses, setResponses] = useState<QuestionResponse[]>([]);
    const [loadingResponses, setLoadingResponses] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Channels
            const channelsRes = await fetch(`${API_URL}/slack/channels`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (channelsRes.ok) {
                const data = await channelsRes.json();
                setChannels(data.channels || []);
            } else {
                console.error('Failed to fetch channels:', await channelsRes.text());
            }

            // Fetch Questions
            const questionsRes = await fetch(`${API_URL}/slack/questions`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (questionsRes.ok) {
                const data = await questionsRes.json();
                setQuestions(data);
            } else {
                console.error('Failed to fetch questions:', await questionsRes.text());
            }
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_URL}/slack/questions/${editingId}`
                : `${API_URL}/slack/questions`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id'
                },
                body: JSON.stringify({
                    title, text, targetType, targetId, frequency, timeOfDay, selectedDays
                })
            });
            if (res.ok) {
                setIsCreating(false);
                setEditingId(null);
                setTitle(''); setText(''); setTargetId(''); setSelectedDays([]);
                fetchData();
                toast({ title: 'Success', description: editingId ? 'Question updated successfully!' : 'Question scheduled successfully!', variant: 'success' });
            } else {
                const error = await res.text();
                toast({ title: 'Error', description: `Failed to ${editingId ? 'update' : 'create'} question: ${error}`, variant: 'destructive' });
            }
        } catch (e) {
            console.error('Submit error:', e);
            toast({ title: 'Error', description: `Failed to ${editingId ? 'update' : 'create'} question. Check console for details.`, variant: 'destructive' });
        }
    };

    const handleEdit = async (question: ScheduledQuestion) => {
        // Ensure channels are loaded before editing
        if (channels.length === 0) {
            try {
                const channelsRes = await fetch(`${API_URL}/slack/channels`, {
                    headers: { 'x-user-id': 'default-user-id' }
                });
                if (channelsRes.ok) {
                    const data = await channelsRes.json();
                    setChannels(data.channels || []);
                }
            } catch (e) {
                console.error('Failed to fetch channels for edit:', e);
            }
        }

        setEditingId(question.id);
        setTitle(question.title);
        setText(question.text);
        setTargetType(question.targetType as any);
        setTargetId(question.targetId || '');
        setFrequency(question.frequency);
        setTimeOfDay(question.timeOfDay);
        setSelectedDays(question.selectedDays || []);
        setIsCreating(true);
    };

    const handleCancelEdit = () => {
        setIsCreating(false);
        setEditingId(null);
        setTitle('');
        setText('');
        setTargetId('');
        setSelectedDays([]);
    };

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`${API_URL}/slack/questions/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                fetchData();
                toast({ title: 'Deleted', description: 'Question deleted successfully!', variant: 'success' });
            } else {
                toast({ title: 'Error', description: 'Failed to delete question', variant: 'destructive' });
            }
        } catch (e) {
            console.error('Delete error:', e);
            toast({ title: 'Error', description: 'Failed to delete question', variant: 'destructive' });
        }
    };

    const handleRunNow = async () => {
        try {
            const res = await fetch(`${API_URL}/slack/questions/run`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.sent === 0) {
                    toast({ title: 'Run Complete', description: 'Sent: 0 questions. Nothing was due based on current schedules.', variant: 'default' });
                } else {
                    toast({ title: 'Run Complete', description: `Sent: ${data.sent} question(s)`, variant: 'success' });
                }
                fetchData();
            } else {
                const error = await res.text();
                toast({ title: 'Error', description: `Failed to run check: ${error}`, variant: 'destructive' });
            }
        } catch (e) {
            console.error('Run error:', e);
            toast({ title: 'Error', description: 'Failed to run check. Make sure Slack is connected.', variant: 'destructive' });
        }
    };

    const handleTestRun = async (id: string) => {
        if (!confirm('This will send the question immediately, ignoring the schedule. Continue?')) return;
        try {
            const res = await fetch(`${API_URL}/slack/questions/${id}/test`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                toast({ title: 'Sent', description: 'Test message sent successfully!', variant: 'success' });
                fetchData();
            } else {
                const error = await res.text();
                toast({ title: 'Error', description: `Failed to send test: ${error}`, variant: 'destructive' });
            }
        } catch (e) {
            console.error('Test error:', e);
            toast({ title: 'Error', description: 'Failed to send test.', variant: 'destructive' });
        }
    };

    const fetchResponses = async (questionId: string) => {
        setLoadingResponses(true);
        try {
            const res = await fetch(`${API_URL}/slack/questions/${questionId}/responses`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const data = await res.json();
                setResponses(data.responses || []);
            } else {
                console.error('Failed to fetch responses');
                setResponses([]);
            }
        } catch (e) {
            console.error('Fetch responses error:', e);
            setResponses([]);
        } finally {
            setLoadingResponses(false);
        }
    };

    const toggleResponses = async (questionId: string) => {
        if (expandedQuestionId === questionId) {
            // Collapse
            setExpandedQuestionId(null);
            setResponses([]);
        } else {
            // Expand and fetch
            setExpandedQuestionId(questionId);
            await fetchResponses(questionId);
        }
    };

    if (loading && questions.length === 0) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto p-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-md" />
                        <Skeleton className="h-10 w-32 rounded-md" />
                    </div>
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
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
                        className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                    >
                        <Play className="w-4 h-4" /> Run Check
                    </button>
                    <button
                        onClick={() => { setIsCreating(!isCreating); setSelectedDays([]); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Question
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {isCreating && (
                <Card className="border-primary/20 bg-muted/30">
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit Schedule' : 'Create New Schedule'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Internal Title</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-md bg-card"
                                        placeholder="e.g. Daily Standup"
                                        value={title} onChange={e => setTitle(e.target.value)} required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Frequency</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md bg-card"
                                        value={frequency} onChange={e => setFrequency(e.target.value)}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="once">Once</option>
                                        <option value="always_test">Always (Test Mode)</option>
                                    </select>
                                </div>
                            </div>

                            {(frequency === 'daily' || frequency === 'weekly') && (
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Days Active</label>
                                    <div className="flex gap-2">
                                        {DAYS.map(day => (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => toggleDay(day.id)}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${selectedDays.includes(day.id)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-card border hover:bg-muted'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Leave empty to run every day.</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium mb-1 block">Question Text</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-md min-h-[80px] bg-card"
                                    placeholder="What did you work on yesterday? What are you working on today?"
                                    value={text} onChange={e => setText(e.target.value)} required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Post To</label>
                                    <select
                                        className="w-full px-3 py-2 border rounded-md bg-card disabled:opacity-50"
                                        value={targetId}
                                        onChange={e => setTargetId(e.target.value)}
                                        required
                                        disabled={channels.length === 0}
                                    >
                                        <option value="">
                                            {channels.length === 0 ? 'Loading channels...' : 'Select a Channel...'}
                                        </option>
                                        {channels.map(c => (
                                            <option key={c.id} value={c.id}>#{c.name}</option>
                                        ))}
                                    </select>
                                    {channels.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">Make sure Slack is connected in Settings.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Time (Approx)</label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2 border rounded-md bg-card"
                                        value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 hover:underline">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-md">
                                    {editingId ? 'Update Schedule' : 'Save Schedule'}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {questions.length === 0 && !isCreating && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
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
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-lg">{q.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 bg-muted rounded uppercase font-medium text-muted-foreground">{q.frequency}</span>
                                            <button onClick={() => handleTestRun(q.id)} className="text-blue-500 hover:text-blue-600 p-1" title="Test Run Now (Force)">
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(q)} className="text-primary hover:text-primary/80 p-1" title="Edit">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(q.id)} className="text-destructive hover:text-destructive/80 p-1" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground mb-3">{q.text}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                                        {q.selectedDays && q.selectedDays.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-primary" />
                                                <span className="text-primary">{q.selectedDays.join(', ')}</span>
                                            </div>
                                        )}
                                        {q.lastSentAt && (
                                            <div className="text-xs text-success">
                                                Last sent: {new Date(q.lastSentAt).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* View Responses Button */}
                            <div className="mt-4 pt-4 border-t">
                                <button
                                    onClick={() => toggleResponses(q.id)}
                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    View Responses
                                    {expandedQuestionId === q.id ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Responses Section */}
                            {expandedQuestionId === q.id && (
                                <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-sm">Team Responses</h4>
                                        <button
                                            onClick={() => fetchResponses(q.id)}
                                            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                                            disabled={loadingResponses}
                                        >
                                            <RefreshCw className={`w-3 h-3 ${loadingResponses ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>
                                    </div>

                                    {loadingResponses ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : responses.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No responses yet</p>
                                            <p className="text-xs mt-1">Responses will appear here when team members reply in the Slack thread.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {responses.map((r) => (
                                                <div key={r.id} className="p-3 bg-card rounded-lg border">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-primary/10 rounded-full">
                                                            <User className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium text-sm">{r.slackUser}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(r.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-foreground/90">{r.text}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
