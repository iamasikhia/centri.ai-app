'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
    Target, CheckCircle2, Clock, User, Users,
    Loader2, Plus, Calendar, AlertTriangle,
    ChevronDown, ChevronRight, Search, Filter,
    ArrowUpRight, ArrowRight, ListTodo
} from 'lucide-react';
import axios from 'axios';
import { format, formatDistanceToNow, isBefore, addDays } from 'date-fns';

interface ActionItem {
    id: string;
    title: string;
    owner: string;
    ownerEmail?: string;
    dueDate?: string;
    status: 'open' | 'in_progress' | 'completed';
    source: 'meeting' | 'manual' | 'task';
    sourceId?: string;
    sourceName?: string;
    createdAt: string;
    priority?: 'high' | 'medium' | 'low';
}

interface OwnerStats {
    owner: string;
    total: number;
    open: number;
    overdue: number;
}

export default function ActionItemsPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ActionItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'open' | 'overdue' | 'completed'>('open');
    const [ownerFilter, setOwnerFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'list' | 'by_owner'>('by_owner');

    const [addingNew, setAddingNew] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', owner: '', dueDate: '', priority: 'medium' });
    const [submitting, setSubmitting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchActionItems();
    }, []);

    const fetchActionItems = async () => {
        try {
            const res = await axios.get(`${API_URL}/action-items`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.data) {
                setItems(res.data);
            }
        } catch (e) {
            console.error('Failed to fetch action items', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleComplete = async (item: ActionItem) => {
        const newStatus = item.status === 'completed' ? 'open' : 'completed';
        setItems(prev => prev.map(i =>
            i.id === item.id ? { ...i, status: newStatus } : i
        ));
        try {
            await axios.put(`${API_URL}/action-items/${item.id}/toggle`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (e) {
            console.error('Failed to toggle item', e);
        }
    };

    const addNewItem = async () => {
        if (!newItem.title.trim()) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/action-items`, newItem, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.data) {
                setItems(prev => [res.data, ...prev]);
            }
            setNewItem({ title: '', owner: '', dueDate: '', priority: 'medium' });
            setAddingNew(false);
        } catch (e) {
            console.error('Failed to create item', e);
        } finally {
            setSubmitting(false);
        }
    };

    // Get unique owners
    const uniqueOwners = [...new Set(items.map(i => i.owner))].sort();

    // Calculate stats
    const now = new Date();
    const totalOpen = items.filter(i => i.status !== 'completed').length;
    const totalOverdue = items.filter(i => i.dueDate && isBefore(new Date(i.dueDate), now) && i.status !== 'completed').length;
    const totalCompleted = items.filter(i => i.status === 'completed').length;

    // Owner stats
    const ownerStats: OwnerStats[] = uniqueOwners.map(owner => {
        const ownerItems = items.filter(i => i.owner === owner);
        return {
            owner,
            total: ownerItems.length,
            open: ownerItems.filter(i => i.status !== 'completed').length,
            overdue: ownerItems.filter(i => i.dueDate && isBefore(new Date(i.dueDate), now) && i.status !== 'completed').length
        };
    }).sort((a, b) => b.overdue - a.overdue || b.open - a.open);

    // Filter items
    const filteredItems = items.filter(item => {
        // Status filter
        if (filter === 'open' && item.status === 'completed') return false;
        if (filter === 'overdue' && (!item.dueDate || !isBefore(new Date(item.dueDate), now) || item.status === 'completed')) return false;
        if (filter === 'completed' && item.status !== 'completed') return false;

        // Owner filter
        if (ownerFilter !== 'all' && item.owner !== ownerFilter) return false;

        // Search
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });

    // Group by owner for by_owner view
    const groupedByOwner: { [key: string]: ActionItem[] } = {};
    filteredItems.forEach(item => {
        const key = item.owner || 'Unassigned';
        if (!groupedByOwner[key]) groupedByOwner[key] = [];
        groupedByOwner[key].push(item);
    });

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-64 bg-muted rounded" />
                    <div className="h-32 bg-muted rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Target className="w-8 h-8 text-primary" />
                        Action Items
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track who owes what and keep your team accountable
                    </p>
                </div>
                <Button onClick={() => setAddingNew(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Action Item
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilter('open')}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{totalOpen}</p>
                                <p className="text-sm text-muted-foreground">Open</p>
                            </div>
                            <ListTodo className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={`cursor-pointer hover:bg-muted/50 transition-colors ${totalOverdue > 0 ? 'border-red-500/30' : ''}`} onClick={() => setFilter('overdue')}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-2xl font-bold ${totalOverdue > 0 ? 'text-red-600' : ''}`}>{totalOverdue}</p>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </div>
                            <AlertTriangle className={`w-8 h-8 opacity-50 ${totalOverdue > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilter('completed')}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{uniqueOwners.length}</p>
                                <p className="text-sm text-muted-foreground">Team Members</p>
                            </div>
                            <Users className="w-8 h-8 text-violet-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add New Form */}
            {addingNew && (
                <Card className="animate-in slide-in-from-top-2">
                    <CardHeader>
                        <CardTitle className="text-base">New Action Item</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="What needs to be done?"
                            value={newItem.title}
                            onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                            autoFocus
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                placeholder="Assign to (name or email)"
                                value={newItem.owner}
                                onChange={e => setNewItem(prev => ({ ...prev, owner: e.target.value }))}
                            />
                            <Input
                                type="date"
                                value={newItem.dueDate}
                                onChange={e => setNewItem(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                            <NativeSelect
                                value={newItem.priority}
                                onChange={e => setNewItem(prev => ({ ...prev, priority: e.target.value }))}
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </NativeSelect>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" onClick={() => setAddingNew(false)}>Cancel</Button>
                            <Button onClick={addNewItem} disabled={submitting || !newItem.title.trim()}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search action items..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <NativeSelect value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
                        <option value="all">All Owners</option>
                        {uniqueOwners.map(owner => (
                            <option key={owner} value={owner}>{owner}</option>
                        ))}
                    </NativeSelect>
                    <div className="flex rounded-lg border overflow-hidden">
                        <button
                            onClick={() => setView('by_owner')}
                            className={`px-3 py-2 text-sm ${view === 'by_owner' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            <Users className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            <ListTodo className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'all', label: 'All', count: items.length },
                    { key: 'open', label: 'Open', count: totalOpen },
                    { key: 'overdue', label: 'Overdue', count: totalOverdue },
                    { key: 'completed', label: 'Completed', count: totalCompleted },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        {f.label}
                        <span className="ml-2 opacity-70">({f.count})</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            {view === 'by_owner' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(groupedByOwner).map(([owner, ownerItems]) => (
                        <Card key={owner}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        {owner}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">{ownerItems.filter(i => i.status !== 'completed').length} open</Badge>
                                        {ownerItems.some(i => i.dueDate && isBefore(new Date(i.dueDate), now) && i.status !== 'completed') && (
                                            <Badge variant="destructive">overdue</Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {ownerItems.map(item => (
                                    <ActionItemRow key={item.id} item={item} onToggle={toggleComplete} />
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="divide-y">
                        {filteredItems.map(item => (
                            <ActionItemRow key={item.id} item={item} onToggle={toggleComplete} showOwner />
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No action items found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function ActionItemRow({
    item,
    onToggle,
    showOwner = false
}: {
    item: ActionItem;
    onToggle: (item: ActionItem) => void;
    showOwner?: boolean;
}) {
    const isOverdue = item.dueDate && isBefore(new Date(item.dueDate), new Date()) && item.status !== 'completed';

    return (
        <div className={`flex items-start gap-3 py-3 ${item.status === 'completed' ? 'opacity-50' : ''}`}>
            <button
                onClick={() => onToggle(item)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : isOverdue
                            ? 'border-red-400 hover:border-red-500'
                            : 'border-muted-foreground/30 hover:border-primary'
                    }`}
            >
                {item.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
            </button>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through' : ''}`}>
                    {item.title}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {showOwner && (
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.owner}
                        </span>
                    )}
                    {item.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            {isOverdue && <AlertTriangle className="w-3 h-3" />}
                            <Calendar className="w-3 h-3" />
                            {isOverdue ? 'Overdue: ' : 'Due: '}
                            {format(new Date(item.dueDate), 'MMM d')}
                        </span>
                    )}
                    {item.sourceName && (
                        <span className="flex items-center gap-1">
                            From: {item.sourceName}
                        </span>
                    )}
                </div>
            </div>
            {item.priority === 'high' && item.status !== 'completed' && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">HIGH</Badge>
            )}
        </div>
    );
}
