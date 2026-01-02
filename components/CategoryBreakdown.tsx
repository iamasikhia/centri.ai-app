'use client';

interface CategoryBreakdownProps {
    category: string;
    totalSeconds: number;
    domains: Array<{ domain: string; seconds: number }>;
}

const categoryEmojis: { [key: string]: string } = {
    communication: '💬',
    building: '🔨',
    research: '📚',
    meetings: '📅',
    admin: '📋'
};

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export default function CategoryBreakdown({ category, totalSeconds, domains }: CategoryBreakdownProps) {
    if (totalSeconds === 0) return null;

    return (
        <div className="border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{categoryEmojis[category] || '🌐'}</span>
                <div>
                    <h3 className="text-xl font-bold capitalize">{category}</h3>
                    <div className="text-sm text-gray-500">{formatTime(totalSeconds)} total</div>
                </div>
            </div>

            <div className="space-y-2 pl-12">
                {domains.map((domain, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{domain.domain}</span>
                        <span className="font-semibold">{formatTime(domain.seconds)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
