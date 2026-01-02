'use client';

import { formatDuration } from '@/lib/utils';

interface DomainListItem {
    domain: string;
    seconds: number;
    category: string;
}

interface DomainListProps {
    domains: DomainListItem[];
}

const categoryIcons: { [key: string]: string } = {
    communication: '💬',
    building: '🔨',
    research: '📚',
    meetings: '📅',
    admin: '📋'
};

export default function DomainList({ domains }: DomainListProps) {
    if (domains.length === 0) {
        return (
            <div className="text-gray-400 italic">
                No activity tracked yet. Start browsing to see your app usage.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {domains.map((item, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 hover:border-black transition-colors group"
                >
                    <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">
                            {categoryIcons[item.category] || '🌐'}
                        </div>

                        <div className="flex-1">
                            <div className="font-semibold text-lg group-hover:text-black">
                                {item.domain}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                                {item.category}
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-bold tracking-tight">
                            {formatDuration(item.seconds)}
                        </div>
                        <div className="text-xs text-gray-500">
                            {Math.round((item.seconds / 3600) * 10) / 10}h
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
