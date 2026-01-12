'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { scanImageForTasks } from '@/lib/task-ai-utils';
import { Task } from '@/lib/dashboard-utils';
import { X, Camera, Loader2, Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTasks: (tasks: Partial<Task>[]) => void;
    onEditTask?: (task: Partial<Task>) => void;
    taskToEdit?: any; // Using any or specific Todo interface from parent, but Partial<Task> is safer if matched
    isCalendarLinked: boolean;
}

export function AddTaskModal({ isOpen, onClose, onAddTasks, onEditTask, taskToEdit, isCalendarLinked }: AddTaskModalProps) {
    const [mode, setMode] = useState<'manual' | 'scan'>('manual');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedAvailable, setScannedAvailable] = useState<Partial<Task>[]>([]);

    // Manual Form State
    const [manualTitle, setManualTitle] = useState('');
    const [manualDate, setManualDate] = useState('');
    const [manualDescription, setManualDescription] = useState('');
    const [manualPriority, setManualPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [addToCalendar, setAddToCalendar] = useState(false);

    useEffect(() => {
        if (taskToEdit) {
            setManualTitle(taskToEdit.title || '');
            setManualDescription(taskToEdit.description || '');
            setManualDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 16) : '');
            setManualPriority(taskToEdit.priority ? (taskToEdit.priority.charAt(0).toUpperCase() + taskToEdit.priority.slice(1)) as any : 'Medium');
            setMode('manual');
        } else {
            // Reset if not editing
            setManualTitle('');
            setManualDescription('');
            setManualDate('');
            setManualPriority('Medium');
            setAddToCalendar(false);
        }
    }, [taskToEdit, isOpen]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const results = await scanImageForTasks(file);
            setScannedAvailable(results);
        } catch (error) {
            console.error("Scanning failed", error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleConfirmScanned = () => {
        onAddTasks(scannedAvailable);
        setScannedAvailable([]);
        onClose();
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const taskData = {
            title: manualTitle,
            description: manualDescription,
            dueDate: manualDate || undefined,
            priority: manualPriority,
            status: 'pending',
        };

        if (taskToEdit && onEditTask) {
            onEditTask({
                ...taskData,
                addToCalendar // Add logic for this in edit flow if needed, but usually create-only
            } as any);
        } else {
            onAddTasks([{
                id: `manual-${Date.now()}`,
                ...taskData,
                source: 'other',
                // @ts-ignore - passing extra flag for backend
                addToCalendar: addToCalendar
            }]);
        }

        setManualTitle('');
        setManualDate('');
        setManualDescription('');
        setManualPriority('Medium');
        setAddToCalendar(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                    <h2 className="text-lg font-bold">{taskToEdit ? 'Edit Task' : 'Add New Tasks'}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Tabs - Only show when creating new task */}
                {!taskToEdit && (
                    <div className="flex border-b">
                        <button
                            onClick={() => setMode('manual')}
                            className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", mode === 'manual' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted/50")}
                        >
                            Manual Entry
                        </button>
                        <button
                            onClick={() => setMode('scan')}
                            className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", mode === 'scan' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted/50")}
                        >
                            Scan from Image
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {mode === 'manual' ? (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Task Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Call Marketing Team"
                                    value={manualTitle}
                                    onChange={(e) => setManualTitle(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Add details..."
                                    value={manualDescription}
                                    onChange={(e) => setManualDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">DueDate (Optional)</Label>
                                    <div className="relative">
                                        <Input
                                            id="date"
                                            type="datetime-local"
                                            value={manualDate}
                                            onChange={(e) => setManualDate(e.target.value)}
                                        />
                                    </div>
                                    {!isCalendarLinked && manualDate && (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Saved locally. We'll verify this date when you connect your calendar.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <div className="flex bg-muted rounded-md p-1 h-10 w-full">
                                        {(['Low', 'Medium', 'High'] as const).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setManualPriority(p)}
                                                className={cn(
                                                    "flex-1 rounded-sm text-xs font-medium capitalize transition-all",
                                                    manualPriority === p
                                                        ? "bg-background shadow-sm text-foreground"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>


                            {!taskToEdit && (
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="addToCalendar"
                                        checked={addToCalendar}
                                        onChange={(e) => setAddToCalendar(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        disabled={!isCalendarLinked && !manualDate}
                                    />
                                    <Label htmlFor="addToCalendar" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Add to Calendar
                                    </Label>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <Button type="submit" disabled={!manualTitle} className="gap-2">
                                    {taskToEdit ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {taskToEdit ? 'Save Changes' : 'Add Task'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {/* Upload Area */}
                            {scannedAvailable.length === 0 ? (
                                <div
                                    className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors gap-3 group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                            <p className="text-sm font-medium animate-pulse">Analyzing handwriting...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-muted rounded-full group-hover:scale-110 transition-transform">
                                                <Camera className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Tap to upload a picture</p>
                                                <p className="text-xs text-muted-foreground mt-1">We'll transcribe your notes instantly</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Found {scannedAvailable.length} tasks
                                        </h3>
                                        <Button variant="ghost" size="sm" onClick={() => setScannedAvailable([])} className="h-6 text-xs text-muted-foreground">
                                            Rescan
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                        {scannedAvailable.map((t, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/10 text-sm">
                                                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                                <span className="flex-1 font-medium">{t.title}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{t.priority}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={handleConfirmScanned} className="w-full">
                                        Add All Tasks
                                    </Button>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
