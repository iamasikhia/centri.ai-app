
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { Stakeholder, StakeholderStatus } from '@/types/stakeholder';
import { StakeholderTable } from '@/components/stakeholders/stakeholder-table';
import { StakeholderForm } from '@/components/stakeholders/stakeholder-form';
import { EmailModal } from '@/components/stakeholders/email-modal';
import { ReminderBanner } from '@/components/stakeholders/reminder-banner';
import { addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/contexts/subscription-context';
import { hasFeature } from '@/lib/subscription';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';

export default function StakeholdersPage() {
    const { tier } = useSubscription();
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
    const [emailStakeholder, setEmailStakeholder] = useState<Stakeholder | null>(null);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // --- Fetch from API ---
    const fetchStakeholders = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/stakeholders`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((s: any) => ({
                    ...s,
                    lastContactedAt: s.lastContactedAt ? new Date(s.lastContactedAt) : undefined,
                    nextReachOutAt: new Date(s.nextReachOutAt)
                }));
                setStakeholders(mapped);
            }
        } catch (e) {
            console.error("Failed to fetch stakeholders", e);
            // Fallback to localStorage if API fails
            const saved = localStorage.getItem('centri-stakeholders');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const restored = parsed.map((s: any) => ({
                        ...s,
                        lastContactedAt: s.lastContactedAt ? new Date(s.lastContactedAt) : undefined,
                        nextReachOutAt: new Date(s.nextReachOutAt)
                    }));
                    setStakeholders(restored);
                } catch (parseError) {
                    console.error("Failed to parse localStorage", parseError);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchStakeholders();
    }, [fetchStakeholders]);

    // --- Logic ---
    const calculateNextDate = (fromDate: Date, frequency: { value: number, unit: string }) => {
        const { value, unit } = frequency;
        switch (unit) {
            case 'Days': return addDays(fromDate, value);
            case 'Weeks': return addWeeks(fromDate, value);
            case 'Months': return addMonths(fromDate, value);
            default: return addDays(fromDate, 7);
        }
    };

    const handleCreateOrUpdate = async (data: Partial<Stakeholder>) => {
        setIsSaving(true);
        try {
            if (data.id) {
                // Update
                await fetch(`${API_URL}/stakeholders/${data.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': 'default-user-id'
                    },
                    body: JSON.stringify(data)
                });
                toast({ title: 'Updated', description: 'Stakeholder updated successfully', variant: 'success' });
            } else {
                // Create
                await fetch(`${API_URL}/stakeholders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': 'default-user-id'
                    },
                    body: JSON.stringify(data)
                });
                toast({ title: 'Created', description: 'Stakeholder added successfully', variant: 'success' });
            }
            fetchStakeholders();
            setIsFormOpen(false);
        } catch (e) {
            console.error("Save failed", e);
            toast({ title: 'Error', description: 'Failed to save stakeholder', variant: 'destructive' });
        } finally {
            setIsSaving(false);
            setEditingStakeholder(null);
        }
    };

    const handleDelete = async (s: Stakeholder) => {
        if (!confirm(`Are you sure you want to remove ${s.name}?`)) return;

        try {
            await fetch(`${API_URL}/stakeholders/${s.id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default-user-id' }
            });
            setStakeholders(prev => prev.filter(item => item.id !== s.id));
            toast({ title: 'Deleted', description: 'Stakeholder removed', variant: 'success' });
        } catch (e) {
            console.error("Delete failed", e);
            toast({ title: 'Error', description: 'Failed to delete stakeholder', variant: 'destructive' });
        }
    };

    const handleLogContact = async (s: Stakeholder) => {
        try {
            const res = await fetch(`${API_URL}/stakeholders/${s.id}/log-contact`, {
                method: 'POST',
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const result = await res.json();
                setStakeholders(prev => prev.map(item =>
                    item.id === s.id
                        ? { ...item, lastContactedAt: new Date(result.lastContactedAt), nextReachOutAt: new Date(result.nextReachOutAt) }
                        : item
                ));
                toast({ title: 'Logged', description: 'Contact logged successfully', variant: 'success' });
            }
        } catch (e) {
            console.error("Log contact failed", e);
            // Fallback to local update
            const now = new Date();
            const nextDate = calculateNextDate(now, s.frequency);
            setStakeholders(prev => prev.map(item =>
                item.id === s.id ? { ...item, lastContactedAt: now, nextReachOutAt: nextDate } : item
            ));
        }
    };

    const handleSendEmail = async (id: string, subject: string, body: string) => {
        const s = stakeholders.find(item => item.id === id);
        if (s) {
            await handleLogContact(s);
            toast({ title: 'Email Sent', description: `Email sent to ${s.name}`, variant: 'success' });
        }
    };

    // --- Derived State ---
    const getStatus = (nextDate: Date): string => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(nextDate);
        target.setHours(0, 0, 0, 0);
        const diff = differenceInDays(target, today);
        if (diff < 0) return 'overdue';
        if (diff <= 3) return 'due-soon';
        return 'on-track';
    };

    const overdueCount = stakeholders.filter(s => getStatus(s.nextReachOutAt) === 'overdue').length;
    const dueSoonCount = stakeholders.filter(s => getStatus(s.nextReachOutAt) === 'due-soon').length;

    // Gate access to Pro tier
    if (!hasFeature(tier, 'stakeholderManagement')) {
        return (
            <div className="max-w-4xl mx-auto py-8">
                <UpgradePrompt
                    feature="Stakeholder Management"
                    description="Track relationships, manage follow-ups, and maintain communication with all your stakeholders."
                    requiredTier="pro"
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <Skeleton className="h-11 w-40" />
                </div>
                <Skeleton className="h-16 w-full mb-6" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stakeholder Management</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Manage relationships and communication cadence.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchStakeholders}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button onClick={() => { setEditingStakeholder(null); setIsFormOpen(true); }} size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Stakeholder
                    </Button>
                </div>
            </div>

            <ReminderBanner overdueCount={overdueCount} dueSoonCount={dueSoonCount} />

            <StakeholderTable
                stakeholders={stakeholders}
                onEdit={(s) => { setEditingStakeholder(s); setIsFormOpen(true); }}
                onDelete={handleDelete}
                onEmail={(s) => { setEmailStakeholder(s); setIsEmailOpen(true); }}
                onLogContact={handleLogContact}
            />

            <StakeholderForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSubmit={handleCreateOrUpdate}
                initialData={editingStakeholder}
            />

            <EmailModal
                open={isEmailOpen}
                onOpenChange={setIsEmailOpen}
                stakeholder={emailStakeholder}
                onSend={handleSendEmail}
            />
        </div>
    );
}
