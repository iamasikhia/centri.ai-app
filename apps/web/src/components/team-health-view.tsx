
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { formatPerson, Task, Person } from '@/lib/dashboard-utils';
import { cn } from '@/lib/utils';

export function TeamHealthView({ teamHealth }: { teamHealth: any[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Task Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                {teamHealth.map((member, idx) => (
                    <MemberHealthRow key={idx} data={member} />
                ))}
                {teamHealth.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">No team activity data.</div>
                )}
            </CardContent>
        </Card>
    );
}

function MemberHealthRow({ data }: { data: any }) {
    const [expanded, setExpanded] = useState(false);

    // Safety check for Person object
    const person = formatPerson(data.person, data.person?.email || 'Unknown');

    return (
        <div className="border rounded bg-card overflow-hidden transition-all">
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <Avatar person={data.person} className="w-8 h-8" />
                    <div>
                        <div className="font-medium text-sm">{person.displayName}</div>
                        <div className="text-xs text-muted-foreground">{data.active} tasks active</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {data.blocked > 0 && <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded font-medium">{data.blocked} Blocked</span>}
                    {data.overdue > 0 && <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded font-medium">{data.overdue} Overdue</span>}
                </div>
            </div>

            {expanded && (
                <div className="bg-muted/30 p-3 border-t space-y-3">
                    <SmallTaskList title="Blocked" tasks={data.tasks.blocked} />
                    <SmallTaskList title="Overdue" tasks={data.tasks.overdue} />
                    <SmallTaskList title="Due Soon" tasks={data.tasks.dueSoon} />
                    {data.tasks.blocked.length === 0 && data.tasks.overdue.length === 0 && data.tasks.dueSoon.length === 0 && (
                        <div className="text-xs text-muted-foreground pl-2">No urgent tasks.</div>
                    )}
                </div>
            )}
        </div>
    );
}

function SmallTaskList({ title, tasks }: { title: string, tasks: Task[] }) {
    if (tasks.length === 0) return null;
    return (
        <div>
            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{title}</div>
            <ul className="space-y-1">
                {tasks.map(t => (
                    <li key={t.id} className="text-xs flex items-center justify-between gap-2">
                        <span className="truncate">{t.title}</span>
                        {t.sourceUrl && (
                            <a href={t.sourceUrl} target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary">
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Avatar({ person, className }: { person: Person, className?: string }) {
    if (person?.avatarUrl) {
        return <img src={person.avatarUrl} alt={person.displayName} className={cn("rounded-full object-cover", className || "w-8 h-8")} />;
    }
    const initials = (person.displayName?.[0] || person.email?.[0] || '?').toUpperCase();
    return (
        <div className={cn("rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs", className || "w-8 h-8")}>
            {initials}
        </div>
    );
}
