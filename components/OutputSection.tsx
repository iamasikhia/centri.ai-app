'use client';

interface OutputItem {
    label: string;
    count: number;
}

interface OutputSectionProps {
    items: OutputItem[];
}

export default function OutputSection({ items }: OutputSectionProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">What Came Out of It</h2>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 text-gray-600">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                        <span className="text-lg">
                            {item.count} {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <p className="text-gray-400 italic">
                    Future integrations with Gmail, Calendar, and productivity tools will show what you produced.
                </p>
            )}
        </div>
    );
}
