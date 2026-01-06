'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FundingOpportunity } from '@/data/funding-opportunities'; // Import type
import { cn } from '@/lib/utils';
// Assuming Select is not available as a component based on file list, so using native select

interface AddOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (opp: FundingOpportunity) => void;
}

export function AddOpportunityModal({ isOpen, onClose, onAdd }: AddOpportunityModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        amount: '',
        type: 'Startup Program',
        deadline: '',
        description: '',
        location: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newOpp: FundingOpportunity = {
            id: `user-${Date.now()}`,
            name: formData.name,
            website: formData.website,
            amount: formData.amount,
            type: formData.type as any,
            deadline: formData.deadline || 'Rolling',
            description: formData.description,
            fullDescription: formData.description, // detailed view fallback
            location: formData.location || 'Global',
            stage: ['Idea', 'MVP'], // Default
            whatItOffers: [formData.amount, 'Community Access'], // Defaults
            criteria: ['Open to all'],
            tags: ['User Added'],
            aiInsight: 'You added this opportunity manually.',
            logo: undefined // Will trigger dynamic lookup
        };

        onAdd(newOpp);
        setIsSubmitting(false);
        onClose();

        // Reset form
        setFormData({
            name: '',
            website: '',
            amount: '',
            type: 'Startup Program',
            deadline: '',
            description: '',
            location: ''
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-xl relative animate-in zoom-in-95 duration-200 bg-background border-border">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4" />
                </button>

                <CardHeader>
                    <CardTitle className="text-xl">Add New Opportunity</CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Program Name*</Label>
                                <Input
                                    id="name"
                                    required
                                    placeholder="e.g. Acme Grant"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <select
                                    id="type"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Grant">Grant</option>
                                    <option value="Accelerator">Accelerator</option>
                                    <option value="Venture Capital">Venture Capital</option>
                                    <option value="Startup Program">Startup Program</option>
                                    <option value="Fellowship">Fellowship</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website URL (for Logo)*</Label>
                            <Input
                                id="website"
                                required
                                type="url"
                                placeholder="https://..."
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Funding Amount</Label>
                                <Input
                                    id="amount"
                                    placeholder="e.g. $50k or Equity-free"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline">Deadline</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground">Leave empty for Rolling</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="e.g. Global, Remote, London"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Short Description</Label>
                            <Textarea
                                id="desc"
                                placeholder="What is this opportunity about?"
                                className="resize-none"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Opportunity
                                    </>
                                )}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
