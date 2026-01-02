'use client';

interface TimelineBlock {
    category: string;
    startHour: number;
    duration: number;
}

interface TimelineProps {
    blocks: TimelineBlock[];
}

const categoryColors: { [key: string]: string } = {
    communication: 'bg-gray-800',
    building: 'bg-gray-700',
    research: 'bg-gray-600',
    meetings: 'bg-gray-500',
    admin: 'bg-gray-400'
};

export default function Timeline({ blocks }: TimelineProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Flow of the Day</h2>

            <div className="relative h-16 bg-gray-100 rounded overflow-hidden">
                <div className="absolute inset-0 flex">
                    {blocks.map((block, index) => {
                        const leftPercent = (block.startHour / 24) * 100;
                        const widthPercent = (block.duration / 24) * 100;

                        return (
                            <div
                                key={index}
                                className={`absolute h-full ${categoryColors[block.category] || 'bg-gray-400'} transition-opacity hover:opacity-75`}
                                style={{
                                    left: `${leftPercent}%`,
                                    width: `${widthPercent}%`
                                }}
                                title={block.category}
                            />
                        );
                    })}
                </div>

                {/* Hour markers */}
                <div className="absolute inset-0 flex justify-between pointer-events-none">
                    {[0, 6, 12, 18, 24].map((hour) => (
                        <div key={hour} className="flex flex-col justify-end pb-1">
                            <div className="h-2 w-px bg-gray-300"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>11:59pm</span>
            </div>
        </div>
    );
}
