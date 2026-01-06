'use client';
import { PRDData } from '@/types/chat';

export function PRDCanvas({ data }: { data: PRDData }) {
    const priorityColor = (p: string) => {
        switch (p) {
            case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="h-full overflow-y-auto p-8 bg-background text-foreground">
            <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
                {/* Header */}
                <div className="border-b pb-6">
                    <div className="text-sm font-medium text-emerald-600 mb-2 uppercase tracking-wider">Product Requirements Document</div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4">{data.title}</h1>
                    <div className="bg-muted/50 p-6 rounded-xl border border-border/50">
                        <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Problem Statement</h3>
                        <p className="text-lg leading-relaxed text-foreground/90 font-medium">{data.problem}</p>
                    </div>
                </div>

                {/* Goals */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">Goals & Success Metrics</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {data.goals.map((g, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-card border rounded-lg shadow-sm">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-0.5 shrink-0">
                                    {i + 1}
                                </div>
                                <span className="leading-snug">{g}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personas */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">User Personas</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {data.personas.map((p, i) => (
                            <div key={i} className="border p-5 rounded-xl bg-card hover:border-primary/50 transition-colors">
                                <div className="font-bold text-lg text-primary mb-1">{p.role}</div>
                                <div className="text-sm text-muted-foreground leading-relaxed">{p.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Stories */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">User Stories</h2>
                    <div className="space-y-3">
                        {data.userStories.map((us, i) => (
                            <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 border rounded-lg items-start sm:items-center group">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide shrink-0 ${priorityColor(us.priority)}`}>
                                    {us.priority}
                                </span>
                                <span className="flex-1 font-medium">{us.story}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Requirements */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Functional Requirements</h2>
                        <ul className="space-y-2">
                            {data.functionalRequirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                    <span>{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-4">Non-Functional Requirements</h2>
                        <ul className="space-y-2">
                            {data.nonFunctionalRequirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
                                    <span>{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Risks */}
                {data.risks && data.risks.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4 text-red-700 dark:text-red-400">risks & Open Questions</h2>
                        <ul className="space-y-2">
                            {data.risks.map((r, i) => (
                                <li key={i} className="flex items-start gap-3 text-red-600 dark:text-red-300">
                                    <span className="font-bold text-lg leading-none opacity-50">!</span>
                                    <span>{r}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
