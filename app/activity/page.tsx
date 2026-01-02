import { prisma } from '@/lib/prisma';
import { formatDuration } from '@/lib/utils';
import { startOfDay } from 'date-fns';

const STUB_USER_ID = 'user_stub_1';

async function getActivityData() {
    const today = startOfDay(new Date());

    // Ensure stub user exists
    let user = await prisma.user.findUnique({
        where: { id: STUB_USER_ID }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                id: STUB_USER_ID,
                email: 'demo@centri.local'
            }
        });
    }

    // Get today's summary with activities
    const summary = await prisma.dailySummary.findUnique({
        where: {
            userId_date: {
                userId: STUB_USER_ID,
                date: today
            }
        },
        include: {
            activities: {
                orderBy: {
                    timestamp: 'desc'
                }
            }
        }
    });

    return summary;
}

export default async function ActivityPage() {
    const summary = await getActivityData();
    const activities = summary?.activities || [];

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <section className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-16">
                    <h1 className="text-7xl font-bold tracking-tight mb-4">Activity</h1>
                    <p className="text-xl text-gray-600">
                        Every recorded activity from today
                    </p>
                </div>
            </section>

            {/* Activity Log */}
            <section>
                <div className="max-w-7xl mx-auto px-8 py-16">
                    {activities.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-6">⏱️</div>
                            <h2 className="text-3xl font-bold mb-4">No Activity Yet</h2>
                            <p className="text-gray-600 text-lg">
                                Start browsing with the Chrome extension to see your activity log
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    {activities.length} {activities.length === 1 ? 'Activity' : 'Activities'}
                                </h2>
                                <div className="text-gray-500">
                                    Total: {formatDuration(summary?.totalActiveSeconds || 0)}
                                </div>
                            </div>

                            {/* Activity List */}
                            <div className="space-y-3">
                                {activities.map((activity: any) => {
                                    const categoryEmojis: { [key: string]: string } = {
                                        communication: '💬',
                                        building: '🔨',
                                        research: '📚',
                                        meetings: '📅',
                                        admin: '📋'
                                    };

                                    const time = new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    });

                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-center justify-between p-6 border border-gray-200 hover:border-black transition-colors group"
                                        >
                                            <div className="flex items-center gap-6 flex-1">
                                                {/* Icon & Category */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-3xl">
                                                        {categoryEmojis[activity.category] || '🌐'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 capitalize">
                                                        {activity.category}
                                                    </span>
                                                </div>

                                                {/* Domain */}
                                                <div className="flex-1">
                                                    <div className="font-bold text-xl group-hover:text-black">
                                                        {activity.domain}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {time}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            <div className="text-right">
                                                <div className="text-2xl font-bold tracking-tight">
                                                    {formatDuration(activity.durationSeconds)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {Math.round(activity.durationSeconds / 60)} min
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
