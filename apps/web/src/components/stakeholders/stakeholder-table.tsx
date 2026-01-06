
import { Stakeholder, StakeholderStatus } from '@/types/stakeholder';
import { Button } from '@/components/ui/button';
import { StakeholderStatusBadge } from './stakeholder-status';
import { Mail, CalendarCheck, Edit, Trash2 } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

interface StakeholderTableProps {
    stakeholders: Stakeholder[];
    onEdit: (s: Stakeholder) => void;
    onDelete: (s: Stakeholder) => void;
    onEmail: (s: Stakeholder) => void;
    onLogContact: (s: Stakeholder) => void;
}

function calculateStatus(nextDate: Date): StakeholderStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextDate);
    target.setHours(0, 0, 0, 0);

    const diff = differenceInDays(target, today);

    if (diff < 0) return 'overdue';
    if (diff <= 3) return 'due-soon';
    return 'on-track';
}

export function StakeholderTable({ stakeholders, onEdit, onDelete, onEmail, onLogContact }: StakeholderTableProps) {
    if (stakeholders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/5">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarCheck className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No stakeholders yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                    Add key partners, managers, and clients to keep track of your communication cadence.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card overflow-hidden">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[250px]">Stakeholder</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Role & Org</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Status</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Cadence</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Next Reach-out</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {stakeholders.map((s) => {
                            const status = calculateStatus(s.nextReachOutAt);
                            return (
                                <tr key={s.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-foreground">{s.name}</span>
                                            <span className="text-xs text-muted-foreground">{s.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-col">
                                            <span>{s.role}</span>
                                            <span className="text-xs text-muted-foreground">{s.organization}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <StakeholderStatusBadge status={status} />
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="text-sm">
                                            Every {s.frequency.value} {s.frequency.unit.toLowerCase()}
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                via {s.preferredChannel}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="text-sm font-medium">
                                            {format(new Date(s.nextReachOutAt), 'MMM d, yyyy')}
                                        </div>
                                        {s.lastContactedAt && (
                                            <div className="text-xs text-muted-foreground">
                                                Last: {format(new Date(s.lastContactedAt), 'MMM d')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEmail(s)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                title="Send Email"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onLogContact(s)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                title="Log Contact"
                                            >
                                                <CalendarCheck className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(s)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(s)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
