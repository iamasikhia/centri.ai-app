
import { useEffect, useState } from 'react';
import { SimpleModal } from './simple-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Stakeholder, Priority, RelationshipType, CommunicationChannel, FrequencyUnit } from '@/types/stakeholder';

interface StakeholderFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: Omit<Stakeholder, 'id' | 'lastContactedAt' | 'nextReachOutAt'> & { id?: string }) => void;
    initialData?: Stakeholder | null;
}

const RELATIONSHIPS: RelationshipType[] = ['Manager', 'Engineer', 'Exec', 'External Partner', 'Other'];
const CHANNELS: CommunicationChannel[] = ['Email', 'Slack', 'Call', 'Meeting'];
const UNITS: FrequencyUnit[] = ['Days', 'Weeks', 'Months'];

export function StakeholderForm({ open, onOpenChange, onSubmit, initialData }: StakeholderFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        organization: '',
        email: '',
        relationship: 'Manager' as RelationshipType,
        priority: 'Medium' as Priority,
        preferredChannel: 'Slack' as CommunicationChannel,
        frequencyValue: 1,
        frequencyUnit: 'Weeks' as FrequencyUnit,
        notes: ''
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    role: initialData.role,
                    organization: initialData.organization,
                    email: initialData.email,
                    relationship: initialData.relationship,
                    priority: initialData.priority,
                    preferredChannel: initialData.preferredChannel,
                    frequencyValue: initialData.frequency.value,
                    frequencyUnit: initialData.frequency.unit,
                    notes: initialData.notes || ''
                });
            } else {
                setFormData({
                    name: '',
                    role: '',
                    organization: '',
                    email: '',
                    relationship: 'Manager',
                    priority: 'Medium',
                    preferredChannel: 'Slack',
                    frequencyValue: 2,
                    frequencyUnit: 'Weeks',
                    notes: ''
                });
            }
        }
    }, [initialData, open]);

    const handleSubmit = () => {
        onSubmit({
            id: initialData?.id,
            name: formData.name,
            role: formData.role,
            organization: formData.organization,
            email: formData.email,
            relationship: formData.relationship,
            priority: formData.priority,
            preferredChannel: formData.preferredChannel,
            frequency: {
                value: Number(formData.frequencyValue),
                unit: formData.frequencyUnit
            },
            notes: formData.notes
        });
        onOpenChange(false);
    };

    return (
        <SimpleModal
            open={open}
            onClose={() => onOpenChange(false)}
            title={initialData ? 'Edit Stakeholder' : 'Add New Stakeholder'}
            maxWidth="max-w-2xl"
        >
            <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Alice Smith"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="alice@company.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Role / Title</Label>
                        <Input
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            placeholder="VP of Product"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Organization</Label>
                        <Input
                            value={formData.organization}
                            onChange={e => setFormData({ ...formData, organization: e.target.value })}
                            placeholder="Acme Inc."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Relationship</Label>
                        <NativeSelect
                            value={formData.relationship}
                            onChange={e => setFormData({ ...formData, relationship: e.target.value as RelationshipType })}
                        >
                            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                        </NativeSelect>
                    </div>
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <NativeSelect
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                        >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </NativeSelect>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Reach-out Cadence</Label>
                    <div className="flex gap-4 items-center">
                        <span className="text-sm text-muted-foreground w-12 shrink-0">Every</span>
                        <Input
                            type="number"
                            min={1}
                            className="w-20"
                            value={formData.frequencyValue}
                            onChange={e => setFormData({ ...formData, frequencyValue: parseInt(e.target.value) || 1 })}
                        />
                        <NativeSelect
                            value={formData.frequencyUnit}
                            onChange={e => setFormData({ ...formData, frequencyUnit: e.target.value as FrequencyUnit })}
                            className="w-32"
                        >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </NativeSelect>
                        <span className="text-sm text-muted-foreground">via</span>
                        <NativeSelect
                            value={formData.preferredChannel}
                            onChange={e => setFormData({ ...formData, preferredChannel: e.target.value as CommunicationChannel })}
                            className="w-32"
                        >
                            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                        </NativeSelect>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Key interests, communication style, etc."
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!formData.name || !formData.email}>
                        {initialData ? 'Save Changes' : 'Create Stakeholder'}
                    </Button>
                </div>
            </div>
        </SimpleModal>
    );
}
