
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Stakeholder, StakeholderStatus } from '@/types/stakeholder';
import { StakeholderTable } from '@/components/stakeholders/stakeholder-table';
import { StakeholderForm } from '@/components/stakeholders/stakeholder-form';
import { EmailModal } from '@/components/stakeholders/email-modal';
import { ReminderBanner } from '@/components/stakeholders/reminder-banner';
import { addDays, addWeeks, addMonths, differenceInDays } from 'date-fns';

export default function StakeholdersPage() {
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
    const [emailStakeholder, setEmailStakeholder] = useState<Stakeholder | null>(null);
    const [isEmailOpen, setIsEmailOpen] = useState(false);

    // --- Persistence ---
    useEffect(() => {
        const saved = localStorage.getItem('centri-stakeholders');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Fix date strings back to Date objects
                const restored = parsed.map((s: any) => ({
                    ...s,
                    lastContactedAt: s.lastContactedAt ? new Date(s.lastContactedAt) : undefined,
                    nextReachOutAt: new Date(s.nextReachOutAt)
                }));
                setStakeholders(restored);
            } catch (e) {
                console.error("Failed to load stakeholders", e);
            }
        }
    }, []);

    useEffect(() => {
        if (stakeholders.length > 0) {
            localStorage.setItem('centri-stakeholders', JSON.stringify(stakeholders));
        }
    }, [stakeholders]);

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

    const handleCreateOrUpdate = (data: Partial<Stakeholder>) => {
        if (data.id) {
            // Update
            setStakeholders(prev => prev.map(s => s.id === data.id ? { ...s, ...data } as Stakeholder : s));
        } else {
            // Create
            const now = new Date();
            // Default next reach out is based on creation time + frequency logic, or just T+Freq
            // If we assume "Start now", then next is Today + Frequency.
            const nextDate = calculateNextDate(now, data.frequency as any);

            const newStakeholder: Stakeholder = {
                id: Date.now().toString(),
                ...data as any,
                lastContactedAt: undefined,
                nextReachOutAt: nextDate,
            };
            setStakeholders(prev => [...prev, newStakeholder]);
        }
        setEditingStakeholder(null);
    };

    const handleDelete = (s: Stakeholder) => {
        if (confirm(`Are you sure you want to remove ${s.name}?`)) {
            setStakeholders(prev => prev.filter(item => item.id !== s.id));
        }
    };

    const handleLogContact = (s: Stakeholder) => {
        const now = new Date();
        const nextDate = calculateNextDate(now, s.frequency);
        const updated = {
            ...s,
            lastContactedAt: now,
            nextReachOutAt: nextDate
        };
        setStakeholders(prev => prev.map(item => item.id === s.id ? updated : item));
    };

    const handleSendEmail = async (id: string, subject: string, body: string) => {
        // In a real app, call API here.
        // For now, we mock success and log contact.
        const s = stakeholders.find(item => item.id === id);
        if (s) {
            handleLogContact(s);
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

    return (
        <div className="h-full flex flex-col p-6 max-w-[1600px] mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stakeholder Management</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Manage relationships and communication cadence.</p>
                </div>
                <Button onClick={() => { setEditingStakeholder(null); setIsFormOpen(true); }} size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Stakeholder
                </Button>
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
