import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Info, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface MetricExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    metricKey: 'cycle-time' | 'meeting-load' | 'features-completed' | 'investment';
    value: string | number;
    description: string;
    calculationDetails?: {
        formula: string;
        source: string;
        inclusions: string[];
        exclusions: string[];
    };
}

export function MetricExplanationModal({ isOpen, onClose, title, metricKey, value, calculationDetails }: MetricExplanationModalProps) {

    // Default content based on key if not provided
    const content = calculationDetails || getDefaultContent(metricKey);

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        How we calculated "{title}"
                    </DialogTitle>
                    <DialogDescription>
                        Transparency breakdown for this metric.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* The Number */}
                    <div className="p-4 bg-muted/30 rounded-lg border flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Current Value</span>
                        <span className="text-2xl font-bold">{value}</span>
                    </div>

                    {/* Formula */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Calculation Logic
                        </h4>
                        <div className="text-sm bg-muted p-3 rounded font-mono text-xs">
                            {content.formula}
                        </div>
                    </div>

                    {/* Inclusions / Exclusions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Included
                            </h4>
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                                {content.inclusions.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Excluded
                            </h4>
                            <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                                {content.exclusions.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>

                    {/* Source */}
                    <div className="text-xs text-muted-foreground pt-4 border-t">
                        Data Source: <span className="font-semibold text-foreground">{content.source}</span>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}

function getDefaultContent(key: string) {
    switch (key) {
        case 'cycle-time':
            return {
                formula: "Avg(Merge Time - First Commit Time) for last 10 PRs",
                source: "GitHub API (Pull Requests)",
                inclusions: ["Merged PRs to main branch", "PRs merged in last 7 days"],
                exclusions: ["Draft PRs", "Closed without merge", "PRs older than 30 days"]
            };
        case 'meeting-load':
            return {
                formula: "(Total Meeting Hours / 40h Work Week) * 100",
                source: "Connected Calendar (Google/Outlook)",
                inclusions: ["Accepted meetings", "Internal syncing", "Client calls"],
                exclusions: ["Declined events", "All-day blockers", "Private events"]
            };
        // Add others...
        default:
            return {
                formula: "Standard aggregation count",
                source: "System Database",
                inclusions: ["Active records"],
                exclusions: ["Deleted records"]
            };
    }
}
