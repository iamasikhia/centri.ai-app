'use client';

interface InsightProps {
    text: string;
}

export default function DailyInsight({ text }: InsightProps) {
    return (
        <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Daily Insight</h2>

            <p className="text-lg leading-relaxed text-gray-700 max-w-3xl">
                {text}
            </p>
        </div>
    );
}
