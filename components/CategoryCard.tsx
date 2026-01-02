'use client';

import { formatDuration, getPercentageOfDay } from '@/lib/utils';

interface CategoryCardProps {
    title: string;
    seconds: number;
    totalSeconds: number;
}

export default function CategoryCard({ title, seconds, totalSeconds }: CategoryCardProps) {
    const percentage = getPercentageOfDay(seconds, totalSeconds);

    return (
        <div className="border border-black p-8 hover:bg-black hover:text-white transition-colors duration-300 group">
            <div className="mb-4">
                <h3 className="text-sm uppercase tracking-wider text-gray-500 group-hover:text-gray-300">
                    {title}
                </h3>
            </div>

            <div className="space-y-2">
                <div className="text-5xl font-bold tracking-tight">
                    {formatDuration(seconds)}
                </div>

                <div className="text-lg text-gray-600 group-hover:text-gray-400">
                    {percentage}% of day
                </div>
            </div>
        </div>
    );
}
