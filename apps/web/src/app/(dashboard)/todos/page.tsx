'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, AlertCircle, Clock, Archive, RefreshCw, Pencil, CalendarPlus } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { AddTaskModal } from '@/components/dashboard/add-task-modal';
import { Task } from '@/lib/dashboard-utils';
import { toast } from '@/hooks/use-toast';

interface Todo {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: string;
    createdAt: string;
    calendarEventId?: string;
}

interface GroupedTodos {
    dueToday: Todo[];
    overdue: Todo[];
    upcoming: Todo[];
    noDueDate: Todo[];
    completed: Todo[];
}

const priorityColors = {
    low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
};

export default function TodosPage() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    // Check local storage or fetch for calendar status if needed, 
    // but for now we'll just allow sync if user clicks it.
    const [isCalendarLinked, setIsCalendarLinked] = useState(false);

    // Derived grouping state to ensure UI consistency
    const grouped = todos.reduce((acc, todo) => {
        if (todo.status === 'completed') {
            acc.completed.push(todo);
        } else if (todo.dueDate) {
            const date = new Date(todo.dueDate);
            if (isPast(date) && !isToday(date)) acc.overdue.push(todo);
            else if (isToday(date)) acc.dueToday.push(todo);
            else acc.upcoming.push(todo);
        } else {
            acc.noDueDate.push(todo);
        }
        return acc;
    }, {
        dueToday: [] as Todo[],
        overdue: [] as Todo[],
        upcoming: [] as Todo[],
        noDueDate: [] as Todo[],
        completed: [] as Todo[]
    });

    useEffect(() => {
        fetchTodos();
        fetchIntegrationStatus();
    }, []);

    const fetchIntegrationStatus = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/integrations/status`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            const connections = response.data;
            const googleConnected = connections.some((c: any) => c.provider === 'google');
            setIsCalendarLinked(googleConnected);
        } catch (e) {
            console.error("Failed to fetch integration status", e);
        }
    }

    const fetchTodos = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/todos`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            setTodos(response.data.todos || []);
        } catch (error) {
            console.error('Failed to fetch todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/integrations/sync`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            await fetchTodos();
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddTasks = (newTasks: Partial<Task>[]) => {
        const createdTodos: Todo[] = newTasks.map((t, i) => ({
            id: `todo-${Date.now()}-${i}`,
            title: t.title || 'Untitled',
            description: '',
            status: 'pending',
            priority: (t.priority?.toLowerCase() as any) || 'medium',
            dueDate: t.dueDate,
            createdAt: new Date().toISOString()
        }));

        setTodos(prev => [...createdTodos, ...prev]);

        // Fire and forget API calls
        createdTodos.forEach(async todo => {
            try {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/todos`, todo, { headers: { 'x-user-id': 'default-user-id' } });
                // Re-fetch to get real IDs eventually or assume consistent enough
            } catch (e) { }
        });
    };

    const completeTodo = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Optimistic update
        setTodos(prev => prev.map(t =>
            t.id === id ? { ...t, status: 'completed' as const } : t
        ));

        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}/complete`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (error) {
            console.error('Failed to complete todo:', error);
            fetchTodos(); // Revert
        }
    };

    const handleEditTask = async (task: Partial<Task>) => {
        if (!editingTodo) return;

        // Optimistic update
        const updatedTodos = todos.map(t =>
            t.id === editingTodo.id ? {
                ...t,
                ...task,
                priority: task.priority?.toLowerCase() as any,
                status: t.status
            } : t
        );

        setTodos(updatedTodos);

        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/todos/${editingTodo.id}`, {
                ...task,
                priority: task.priority?.toLowerCase()
            }, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            // fetchTodos(); // Optional, but good for ID syncing if we cared, but here we just edit fields
        } catch (e) {
            console.error("Edit failed", e);
            fetchTodos(); // Revert on fail
        }
    };

    const handleAddToCalendar = async (todo: Todo) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/todos/${todo.id}`, {
                addToCalendar: true
            }, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            fetchTodos();
            toast({ title: 'Added', description: 'Task added to Google Calendar', variant: 'success' });
        } catch (e: any) {
            console.error("Add to calendar failed", e);
            toast({ title: 'Calendar Error', description: 'Failed to add to calendar. Please ensure Google Tasks API is enabled and try reconnecting.', variant: 'destructive' });
        }
    };

    const deleteTodo = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this task?')) return;

        setTodos(prev => prev.filter(t => t.id !== id));

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
        } catch (error) {
            console.error('Failed to delete todo:', error);
            fetchTodos();
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
                        <div className="h-4 w-64 bg-muted/50 animate-pulse rounded-lg" />
                    </div>
                    <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="h-64 bg-card border border-border/50 animate-pulse rounded-xl" />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="h-48 bg-card border border-border/50 animate-pulse rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    const TodoItem = ({ todo }: { todo: Todo }) => {
        const isDue = todo.dueDate && isToday(new Date(todo.dueDate));
        const isOverdue = todo.dueDate && isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate));

        return (
            <div
                className={cn(
                    "group flex items-start gap-4 p-4 pl-5 rounded-2xl border bg-card/60 hover:bg-card hover:border-border/80 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden",
                    todo.status === 'completed' && "opacity-60 bg-muted/20 border-transparent hover:bg-muted/30 hover:border-transparent shadow-none"
                )}
            >
                {/* Selection Indicator Bar */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300",
                    todo.priority === 'high' ? "bg-rose-500/50 group-hover:bg-rose-500" :
                        todo.priority === 'medium' ? "bg-amber-500/50 group-hover:bg-amber-500" :
                            "bg-transparent group-hover:bg-primary/50"
                )} />

                <button
                    onClick={(e) => completeTodo(todo.id, e)}
                    className={cn(
                        "mt-0.5 shrink-0 transition-all duration-200 transform group-hover:scale-110",
                        todo.status === 'completed'
                            ? "text-green-500"
                            : "text-muted-foreground/30 hover:text-green-500"
                    )}
                >
                    {todo.status === 'completed' ? (
                        <div className="bg-green-500 rounded-full p-0.5">
                            <CheckCircle2 className="w-5 h-5 text-white fill-none stroke-[3]" />
                        </div>
                    ) : (
                        <Circle className="w-6 h-6 stroke-[1.5]" />
                    )}
                </button>

                <div className="flex-1 min-w-0 pt-0.5 pr-12">
                    <h3 className={cn(
                        "font-medium leading-normal text-base transition-all",
                        todo.status === 'completed' && "line-through text-muted-foreground"
                    )}>
                        {todo.title}
                    </h3>
                    {todo.description && (
                        <p className={cn(
                            "text-sm mt-1.5 line-clamp-2 leading-relaxed font-light",
                            todo.status === 'completed' ? "text-muted-foreground/60" : "text-muted-foreground/80"
                        )}>{todo.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {todo.dueDate && (
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                                isOverdue ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                    isDue ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                        "bg-secondary/50 text-secondary-foreground border-border/40"
                            )}>
                                <Calendar className="w-3 h-3 opacity-70" />
                                {format(new Date(todo.dueDate), 'MMM d')}
                            </span>
                        )}
                        {todo.priority && todo.priority !== 'medium' && (
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider",
                                priorityColors[todo.priority]
                            )}>
                                {todo.priority}
                            </span>
                        )}
                        {todo.calendarEventId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/5 text-blue-600 border border-blue-200/20">
                                <Calendar className="w-3 h-3" />
                                Synced
                            </span>
                        )}
                    </div>
                </div>

                {/* Floating Action Toolbar */}
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 flex items-center gap-1 bg-background/95 backdrop-blur shadow-sm border rounded-lg p-1">
                    {isCalendarLinked && !todo.calendarEventId && todo.dueDate && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCalendar(todo);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                            title="Add to Google Calendar"
                        >
                            <CalendarPlus className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingTodo(todo);
                            setIsAddTaskOpen(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                        title="Edit Task"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-border mx-0.5" />
                    <button
                        onClick={(e) => deleteTodo(todo.id, e)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                        title="Delete Task"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    const TodoSection = ({
        title,
        todos,
        icon,
        variant = 'default'
    }: {
        title: string;
        todos: Todo[];
        icon?: React.ReactNode;
        variant?: 'default' | 'danger' | 'success' | 'warning'
    }) => {
        if (todos.length === 0) return null;

        return (
            <div className="space-y-3">
                <h2 className={cn(
                    "text-xs font-bold flex items-center gap-2 uppercase tracking-wider mb-4 opacity-90",
                    variant === 'danger' ? "text-destructive" :
                        variant === 'success' ? "text-green-500" :
                            variant === 'warning' ? "text-orange-500" :
                                "text-muted-foreground"
                )}>
                    {icon}
                    {title}
                    <span className={cn(
                        "ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset",
                        variant === 'danger' ? "bg-destructive/10 ring-destructive/20 text-destructive" :
                            variant === 'success' ? "bg-green-500/10 ring-green-500/20 text-green-600" :
                                "bg-muted ring-muted-foreground/10 text-muted-foreground"
                    )}>
                        {todos.length}
                    </span>
                </h2>
                <div className="space-y-2">
                    {todos.map((todo) => (
                        <TodoItem key={todo.id} todo={todo} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your daily work and sync with your calendar
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={cn("bg-background shadow-sm hover:bg-muted", isSyncing && "opacity-80")}
                    >
                        <RefreshCw className={cn("w-5 h-5 mr-2", isSyncing && "animate-spin")} />
                        {isSyncing ? 'Syncing...' : 'Sync Calendar'}
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => setIsAddTaskOpen(true)}
                        className="shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Task
                    </Button>
                </div>
            </div>



            {/* Main Grid Layout */}
            {todos.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Actionable Items (Overdue + Today + Upcoming) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Overdue - High Attention */}
                        {grouped.overdue.length > 0 && (
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 sm:p-6 backdrop-blur-sm">
                                <TodoSection
                                    title="Overdue Tasks"
                                    todos={grouped.overdue}
                                    icon={<AlertCircle className="w-5 h-5" />}
                                    variant="danger"
                                />
                            </div>
                        )}

                        {/* Today - Main Focus */}
                        <div className="bg-card/50 rounded-xl border border-border/60 shadow-sm p-5 sm:p-6 min-h-[250px] relative overflow-hidden">
                            {/* Optional subtle gradient accent for Today */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 rounded-l-xl" />

                            {grouped.dueToday.length > 0 ? (
                                <TodoSection
                                    title="Due Today"
                                    todos={grouped.dueToday}
                                    icon={<Calendar className="w-5 h-5 text-primary" />}
                                    variant="warning"
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                    <div className="bg-primary/5 p-4 rounded-full mb-4 ring-1 ring-primary/10">
                                        <CheckCircle2 className="w-8 h-8 text-primary/60" />
                                    </div>
                                    <p className="font-semibold text-foreground">All clear for today</p>
                                    <p className="text-sm text-muted-foreground/80">No immediate tasks remaining.</p>
                                </div>
                            )}
                        </div>

                        {/* Upcoming */}
                        {grouped.upcoming.length > 0 && (
                            <div className="px-2">
                                <TodoSection
                                    title="Upcoming"
                                    todos={grouped.upcoming}
                                    icon={<Clock className="w-4 h-4" />}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Reference (No Date + Completed) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Backlog / No Date */}
                        <div className="bg-card border border-border/50 rounded-xl p-5 sm:p-6 shadow-sm">
                            <TodoSection
                                title="Backlog"
                                todos={grouped.noDueDate}
                                icon={<Archive className="w-4 h-4" />}
                            />
                            {grouped.noDueDate.length === 0 && (
                                <div className="text-center py-6 text-muted-foreground/40 border-2 border-dashed border-muted rounded-lg mt-2">
                                    <p className="text-xs font-medium">No backlog items</p>
                                </div>
                            )}
                        </div>

                        {/* Completed */}
                        <div className="opacity-80">
                            <TodoSection
                                title="Completed"
                                todos={grouped.completed}
                                icon={<CheckCircle2 className="w-4 h-4" />}
                                variant="success"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted rounded-3xl bg-muted/5">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4 border ring-4 ring-muted">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
                    <p className="text-muted-foreground mb-8 max-w-sm">
                        No tasks on your plate. Sync with Google Calendar to import tasks or create one manually.
                    </p>
                    <Button onClick={() => setIsAddTaskOpen(true)} size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Create First Task
                    </Button>
                </div>
            )}
            <AddTaskModal
                isOpen={isAddTaskOpen}
                onClose={() => {
                    setIsAddTaskOpen(false);
                    setEditingTodo(null);
                }}
                onAddTasks={handleAddTasks}
                onEditTask={handleEditTask}
                taskToEdit={editingTodo}
                isCalendarLinked={isCalendarLinked}
            />
        </div>
    );
}
