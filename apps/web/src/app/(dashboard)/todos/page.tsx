'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, AlertCircle, Clock, Archive } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { AddTaskModal } from '@/components/dashboard/add-task-modal';
import { Task } from '@/lib/dashboard-utils';

interface Todo {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: string;
    createdAt: string;
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
    const [grouped, setGrouped] = useState<GroupedTodos>({
        dueToday: [],
        overdue: [],
        upcoming: [],
        noDueDate: [],
        completed: [],
    });
    const [loading, setLoading] = useState(true);

    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

    // Mock functionality for calendar linking
    const isCalendarLinked = false;

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/todos`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            setTodos(response.data.todos || []);
            setGrouped(response.data.grouped || {
                dueToday: [], overdue: [], upcoming: [], noDueDate: [], completed: []
            });
        } catch (error) {
            console.error('Failed to fetch todos:', error);
        } finally {
            setLoading(false);
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

        const newGrouped = { ...grouped };
        createdTodos.forEach(todo => {
            if (todo.dueDate && isToday(new Date(todo.dueDate))) newGrouped.dueToday.push(todo);
            else if (todo.dueDate && isPast(new Date(todo.dueDate))) newGrouped.overdue.push(todo);
            else if (todo.dueDate) newGrouped.upcoming.push(todo);
            else newGrouped.noDueDate.push(todo);
        });

        setGrouped(newGrouped);
        setTodos(prev => [...createdTodos, ...prev]);

        // Fire and forget API calls
        createdTodos.forEach(async todo => {
            try {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/todos`, todo, { headers: { 'x-user-id': 'default-user-id' } });
            } catch (e) { }
        });
    };

    const completeTodo = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // Optimistic update
            const targetTodo = todos.find(t => t.id === id);
            if (targetTodo && targetTodo.status !== 'completed') {
                // optimistically move to completed
                // (Simpler to just fetch for now to ensure consistency with backend group logic)
            }

            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}/complete`, {}, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            fetchTodos();
        } catch (error) {
            console.error('Failed to complete todo:', error);
        }
    };

    const deleteTodo = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            fetchTodos();
        } catch (error) {
            console.error('Failed to delete todo:', error);
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
                    "group flex items-start gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card hover:border-border/80 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer relative",
                    todo.status === 'completed' && "opacity-60 bg-muted/20 border-transparent hover:bg-muted/30 hover:border-transparent shadow-none"
                )}
            >
                <button
                    onClick={(e) => completeTodo(todo.id, e)}
                    className={cn(
                        "mt-0.5 shrink-0 transition-colors duration-200",
                        todo.status === 'completed'
                            ? "text-green-500 hover:text-green-600"
                            : "text-muted-foreground/40 hover:text-green-500"
                    )}
                >
                    {todo.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 fill-current" />
                    ) : (
                        <Circle className="w-5 h-5 stroke-[2.5]" />
                    )}
                </button>

                <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className={cn(
                        "font-medium leading-normal text-[15px]",
                        todo.status === 'completed' && "line-through text-muted-foreground"
                    )}>
                        {todo.title}
                    </h3>
                    {todo.description && (
                        <p className={cn(
                            "text-sm mt-1 line-clamp-2 leading-relaxed",
                            todo.status === 'completed' ? "text-muted-foreground/70" : "text-muted-foreground"
                        )}>{todo.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {todo.dueDate && (
                            <span className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border shadow-sm transition-colors",
                                isOverdue ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" :
                                    isDue ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" :
                                        "bg-secondary text-secondary-foreground border-border/50"
                            )}>
                                <Calendar className="w-3 h-3 opacity-70" />
                                {format(new Date(todo.dueDate), 'MMM d')}
                            </span>
                        )}
                        {todo.priority && todo.priority !== 'medium' && (
                            <span className={cn(
                                "px-2 py-0.5 rounded-md text-xs font-semibold border uppercase tracking-wider shadow-sm",
                                priorityColors[todo.priority]
                            )}>
                                {todo.priority}
                            </span>
                        )}
                        {/* {todo.status === 'completed' && (
                             <span className="text-[10px] text-muted-foreground/50 font-medium px-1">
                                Completed
                             </span>
                        )} */}
                    </div>
                </div>

                <button
                    onClick={(e) => deleteTodo(todo.id, e)}
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-2 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
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
                <Button
                    size="lg"
                    onClick={() => setIsAddTaskOpen(true)}
                    className="shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Task
                </Button>
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
                onClose={() => setIsAddTaskOpen(false)}
                onAddTasks={handleAddTasks}
                isCalendarLinked={isCalendarLinked}
            />
        </div>
    );
}
