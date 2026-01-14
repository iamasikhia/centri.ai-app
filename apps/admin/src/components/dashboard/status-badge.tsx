import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle } from "lucide-react";

type Status = 'healthy' | 'degraded' | 'down' | 'maintenance';

interface StatusBadgeProps {
    status: Status;
    label?: string;
    className?: string;
}

const config = {
    healthy: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10", border: "border-green-200" },
    degraded: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-200" },
    down: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", border: "border-red-200" },
    maintenance: { icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-200" },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
    const defaultConfig = { icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-500/10", border: "border-gray-200" };
    const { icon: Icon, color, bg, border } = config[status] || defaultConfig;

    return (
        <div className={cn("flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors", color, bg, border, className)}>
            <Icon className="h-3 w-3" />
            <span>{label || status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
    );
}
