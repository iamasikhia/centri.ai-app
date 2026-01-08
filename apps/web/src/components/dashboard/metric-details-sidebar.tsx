import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailedMetric } from "@/lib/dashboard-utils";

interface MetricDetailsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    metric: DetailedMetric | null;
    githubData?: any;
}

export function MetricDetailsSidebar({ isOpen, onClose, metric, githubData }: MetricDetailsSidebarProps) {
    if (!metric) return null;

    let items: any[] = [];
    let type = 'general';
    let actualValue = metric.value; // Default to passed value

    if (githubData) {
        if (metric.id === 'repo-updates') {
            type = 'commit';
            const commits = githubData.commits || [];

            // Recalculate Active Dev Days based on filtered data
            const now = new Date();
            const commitsLast7d = commits.filter((c: any) => {
                const commitDate = new Date(c.date);
                const daysDiff = Math.floor((now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff <= 7;
            });

            // Count unique days
            const uniqueDays = new Set(
                commitsLast7d.map((c: any) => new Date(c.date).toDateString())
            ).size;

            actualValue = uniqueDays;

            items = commits.slice(0, 15).map((c: any) => ({
                id: c.sha,
                title: c.message,
                description: `By ${c.author} in ${c.repo}`,
                date: new Date(c.date).toLocaleString()
            }));
        } else if (metric.id === 'eng-changes') {
            type = 'pr';
            const prs = githubData.prs || [];

            // Recalculate merged PRs count
            const now = new Date();
            const mergedLast7d = prs.filter((p: any) => {
                if (!p.merged || !p.merged_at) return false;
                const mergeDate = new Date(p.merged_at);
                const daysDiff = Math.floor((now.getTime() - mergeDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff <= 7;
            });

            actualValue = mergedLast7d.length;

            items = prs.slice(0, 15).map((p: any) => ({
                id: p.id,
                title: p.title,
                description: `PR #${p.number} by ${p.author} in ${p.repo}`,
                date: new Date(p.created_at).toLocaleString(),
                status: p.state
            }));
        } else if (metric.id === 'shipped') {
            type = 'release';
            const releases = githubData.releases || [];

            // Recalculate releases count
            const now = new Date();
            const releasesLast7d = releases.filter((r: any) => {
                const releaseDate = new Date(r.published_at);
                const daysDiff = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff <= 7;
            });

            actualValue = releasesLast7d.length;

            items = releases.slice(0, 15).map((r: any) => ({
                id: r.id,
                title: r.name || r.tag_name,
                description: `Release ${r.tag_name} in ${r.repo}`,
                date: new Date(r.published_at).toLocaleString()
            }));
        }
    }

    // Fallback if no specific data or empty
    if (items.length === 0) {
        items = [
            { id: '1', title: 'No detailed data available', description: 'Try making some commits or PRs!', date: 'Now' }
        ];
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold">{metric.title} Details</SheetTitle>
                    </div>
                    <SheetDescription className="text-muted-foreground">
                        {metric.description}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Big Stats */}
                    <div className="p-6 bg-muted/20 rounded-xl border flex flex-col items-center justify-center gap-2">
                        <span className="text-5xl font-bold tracking-tight">{actualValue}</span>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Current Value</span>
                    </div>

                    {/* Breakdown List */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            Recent Activity ({items.length})
                        </h3>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors">
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                        <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
                                        <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded shrink-0">{item.date}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                    {item.status && (
                                        <span className="inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 uppercase">
                                            {item.status}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
