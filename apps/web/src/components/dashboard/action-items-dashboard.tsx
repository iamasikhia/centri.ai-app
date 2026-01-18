'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
    Target, CheckCircle2, Clock, User,
    Loader2, Plus, Calendar, AlertTriangle,
    ChevronDown, ChevronRight, Filter
} from 'lucide-react';
import axios from 'axios';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

interface ActionItem {
    id: string;
    title: string;
    owner: string;
    ownerEmail?: string;
    dueDate?: string;
    status: 'open' | 'in_progress' | 'completed';
    source: 'meeting' | 'manual' | 'slack';
    sourceId?: string;
    sourceName?: string;
    createdAt: string;
    priority?: 'high' | 'medium' | 'low';
}

interface OwnerGroup {
    owner: string;
    email?: string;
    items: ActionItem[];
    openCount: number;
}

export function ActionItemsDashboard() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ActionItem[]>([]);
    const [groupedByOwner, setGroupedByOwner] = useState<OwnerGroup[]>([]);
    const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'overdue' | 'this_week' | 'mine'>('all');
    const [addingNew, setAddingNew] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', owner: '', dueDate: '' });
    const [submitting, setSubmitting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchActionItems();
    }, []);

    useEffect(() => {
        // Group items by owner
        const groups: { [key: string]: OwnerGroup } = {};
        items.forEach(item => {
            const key = item.owner || 'Unassigned';
            if (!groups[key]) {
                groups[key] = { owner: key, email: item.ownerEmail, items: [], openCount: 0 };
            }
            groups[key].items.push(item);
            if (item.status !== 'completed') {
                groups[key].openCount++;
            }
        });

        // Sort by open count descending
        const sorted = Object.values(groups).sort((a, b) => b.openCount - a.openCount);
        setGroupedByOwner(sorted);

        // Auto-expand first 3 owners
        const initialExpanded = new Set(sorted.slice(0, 3).map(g => g.owner));
        setExpandedOwners(initialExpanded);
    }, [items]);

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
            // Keep items empty if API fails - no mock data
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleComplete = async (item: ActionItem) => {
        // Optimistic update
        const originalStatus = item.status;
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
            // Revert on failure
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, status: originalStatus } : i
            ));
        }
    };

    const addNewItem = async () => {
        if (!newItem.title.trim()) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/action-items`, {
                title: newItem.title,
                owner: newItem.owner,
                dueDate: newItem.dueDate,
                priority: 'medium'
            }, {
                headers: { 'x-user-id': 'default-user-id' }
            });

            if (res.data) {
                setItems(prev => [res.data, ...prev]);
                setNewItem({ title: '', owner: '', dueDate: '' });
                setAddingNew(false);
            }
        } catch (e) {
            console.error('Failed to add item', e);
        } finally {
            setSubmitting(false);
        }
    };

    const getFilteredItems = () => {
        const now = new Date();
        switch (filter) {
            case 'overdue':
                return items.filter(i => i.dueDate && isBefore(new Date(i.dueDate), now) && i.status !== 'completed');
            case 'this_week':
                const weekFromNow = addDays(now, 7);
                return items.filter(i => i.dueDate && isBefore(new Date(i.dueDate), weekFromNow) && i.status !== 'completed');
            case 'mine':
                return items.filter(i => i.owner === 'You' || !i.owner);
            default:
                return items;
        }
    };

    const overdueCount = items.filter(i => i.dueDate && isBefore(new Date(i.dueDate), new Date()) && i.status !== 'completed').length;
    const openCount = items.filter(i => i.status !== 'completed').length;

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Action Items
                        <Badge variant="secondary" className="ml-2">{openCount} open</Badge>
                        {overdueCount > 0 && (
                            <Badge variant="destructive">{overdueCount} overdue</Badge>
                        )}
                    </CardTitle>
                    <Button size="sm" onClick={() => setAddingNew(true)} className="gap-1">
                        <Plus className="w-4 h-4" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'overdue', label: 'Overdue', count: overdueCount },
                        { key: 'this_week', label: 'Due This Week' },
                        { key: 'mine', label: 'My Items' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.key
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                        >
                            {f.label}
                            {f.count !== undefined && f.count > 0 && (
                                <span className="ml-1">({f.count})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Add New Form */}
                {addingNew && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3 animate-in slide-in-from-top-2">
                        <Input
                            placeholder="What needs to be done?"
                            value={newItem.title}
                            onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Input
                                placeholder="Assign to..."
                                value={newItem.owner}
                                onChange={e => setNewItem(prev => ({ ...prev, owner: e.target.value }))}
                                className="flex-1"
                            />
                            <Input
                                type="date"
                                value={newItem.dueDate}
                                onChange={e => setNewItem(prev => ({ ...prev, dueDate: e.target.value }))}
                                className="w-40"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setAddingNew(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={addNewItem} disabled={submitting || !newItem.title.trim()}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Item'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Grouped by Owner */}
                <div className="space-y-3">
                    {groupedByOwner.map(group => {
                        const filteredGroupItems = getFilteredItems().filter(i => (i.owner || 'Unassigned') === group.owner);
                        if (filteredGroupItems.length === 0) return null;

                        const isExpanded = expandedOwners.has(group.owner);

                        return (
                            <div key={group.owner} className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => {
                                        setExpandedOwners(prev => {
                                            const next = new Set(prev);
                                            if (next.has(group.owner)) {
                                                next.delete(group.owner);
                                            } else {
                                                next.add(group.owner);
                                            }
                                            return next;
                                        });
                                    }}
                                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        )}
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium">{group.owner}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {filteredGroupItems.filter(i => i.status !== 'completed').length} open
                                        </Badge>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="divide-y">
                                        {filteredGroupItems.map(item => {
                                            const isOverdue = item.dueDate && isBefore(new Date(item.dueDate), new Date()) && item.status !== 'completed';

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-start gap-3 p-3 ${item.status === 'completed' ? 'opacity-50' : ''
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => toggleComplete(item)}
                                                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.status === 'completed'
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'border-muted-foreground/30 hover:border-primary'
                                                            }`}
                                                    >
                                                        {item.status === 'completed' && (
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium ${item.status === 'completed' ? 'line-through' : ''
                                                            }`}>
                                                            {item.title}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
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
                                                    {item.priority === 'high' && (
                                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">HIGH</Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No action items yet</p>
                        <p className="text-sm">Action items from meetings will appear here</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
