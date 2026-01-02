import { prisma } from '@/lib/prisma';
import { formatDuration, formatTimeRange, getTodayISO } from '@/lib/utils';
import CategoryCard from '@/components/CategoryCard';
import Timeline from '@/components/Timeline';
import OutputSection from '@/components/OutputSection';
import DailyInsight from '@/components/DailyInsight';
import DomainList from '@/components/DomainList';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import { startOfDay } from 'date-fns';

// Stub user ID for demo
const STUB_USER_ID = 'user_stub_1';

async function getDailySummary() {
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

    // Get today's summary
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
                    timestamp: 'asc'
                }
            }
        }
    });

    return summary;
}

function generateInsight(summary: any): string {
    if (!summary) {
        return "Start using Centri to track where your work energy goes. Install the Chrome extension to begin.";
    }

    const categories = [
        { name: 'communication', seconds: summary.communicationSeconds },
        { name: 'building', seconds: summary.buildingSeconds },
        { name: 'research', seconds: summary.researchSeconds },
        { name: 'meetings', seconds: summary.meetingsSeconds },
        { name: 'admin', seconds: summary.adminSeconds }
    ].sort((a, b) => b.seconds - a.seconds);

    const dominant = categories[0];
    const focusDuration = summary.focusWindowStart && summary.focusWindowEnd
        ? Math.floor((summary.focusWindowEnd.getTime() - summary.focusWindowStart.getTime()) / 1000)
        : 0;

    if (dominant.name === 'communication') {
        return `Today was communication-heavy with ${formatDuration(dominant.seconds)} spent connecting. ${focusDuration > 1800 ? 'Your longest uninterrupted focus period likely produced the most tangible output.' : 'Consider blocking time for deeper focused work.'}`;
    }

    if (dominant.name === 'building') {
        return `You spent ${formatDuration(dominant.seconds)} building today. Deep work like this compounds over time.`;
    }

    return `Today's energy was distributed across ${categories.filter(c => c.seconds > 0).length} different types of work. ${focusDuration > 3600 ? 'You had strong periods of sustained focus.' : 'Most time was spent in shorter bursts.'}`;
}

export default async function HomePage() {
    const summary = await getDailySummary();

    const totalSeconds = summary?.totalActiveSeconds || 0;
    const focusWindow = summary?.focusWindowStart && summary?.focusWindowEnd
        ? formatTimeRange(summary.focusWindowStart, summary.focusWindowEnd)
        : null;

    // Parse top domains from JSON
    const topDomains = summary?.topDomains
        ? JSON.parse(summary.topDomains)
        : [];

    // Group activities by domain for detailed list
    const domainMap = new Map<string, { seconds: number; category: string }>();
    summary?.activities.forEach((activity: any) => {
        const existing = domainMap.get(activity.domain);
        if (existing) {
            existing.seconds += activity.durationSeconds;
        } else {
            domainMap.set(activity.domain, {
                seconds: activity.durationSeconds,
                category: activity.category
            });
        }
    });

    const allDomains = Array.from(domainMap.entries())
        .map(([domain, data]) => ({
            domain,
            seconds: data.seconds,
            category: data.category
        }))
        .sort((a, b) => b.seconds - a.seconds);

    // Group domains by category for category breakdown
    const domainsByCategory = {
        communication: allDomains.filter(d => d.category === 'communication'),
        building: allDomains.filter(d => d.category === 'building'),
        research: allDomains.filter(d => d.category === 'research'),
        meetings: allDomains.filter(d => d.category === 'meetings'),
        admin: allDomains.filter(d => d.category === 'admin')
    };

    // Convert activities to timeline blocks
    const timelineBlocks = summary?.activities.map((activity: any) => ({
        category: activity.category,
        startHour: activity.timestamp.getHours() + activity.timestamp.getMinutes() / 60,
        duration: activity.durationSeconds / 3600
    })) || [];

    return (
        <main className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-16">
                    <h1 className="text-7xl font-bold tracking-tight mb-6">Today</h1>

                    <div className="flex items-baseline gap-12">
                        <div>
                            <div className="text-sm uppercase tracking-wider text-gray-500 mb-2">
                                Total Active Time
                            </div>
                            <div className="text-6xl font-bold tracking-tight">
                                {formatDuration(totalSeconds)}
                            </div>
                        </div>

                        {focusWindow && (
                            <div>
                                <div className="text-sm uppercase tracking-wider text-gray-500 mb-2">
                                    Most Focused
                                </div>
                                <div className="text-3xl font-semibold tracking-tight">
                                    {focusWindow}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Work Energy Section */}
            <section className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-8">Work Energy</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CategoryCard
                            title="Communication"
                            seconds={summary?.communicationSeconds || 0}
                            totalSeconds={totalSeconds}
                        />
                        <CategoryCard
                            title="Building"
                            seconds={summary?.buildingSeconds || 0}
                            totalSeconds={totalSeconds}
                        />
                        <CategoryCard
                            title="Research"
                            seconds={summary?.researchSeconds || 0}
                            totalSeconds={totalSeconds}
                        />
                        <CategoryCard
                            title="Meetings"
                            seconds={summary?.meetingsSeconds || 0}
                            totalSeconds={totalSeconds}
                        />
                        <CategoryCard
                            title="Admin"
                            seconds={summary?.adminSeconds || 0}
                            totalSeconds={totalSeconds}
                        />
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            {timelineBlocks.length > 0 && (
                <section className="border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-8 py-16">
                        <Timeline blocks={timelineBlocks} />
                    </div>
                </section>
            )}

            {/* Apps & Output Section - Two Column Layout */}
            <section className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-16">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Left Column - Apps & Websites (60%) */}
                        <div className="lg:w-[60%]">
                            <h2 className="text-4xl font-bold tracking-tight mb-8">Apps & Websites</h2>
                            <p className="text-gray-600 mb-8">
                                Detailed breakdown of where you spent your time today
                            </p>
                            {allDomains.length > 0 ? (
                                <DomainList domains={allDomains} />
                            ) : (
                                <div className="text-gray-400 italic">
                                    No activity tracked yet. Start browsing to see your app usage.
                                </div>
                            )}
                        </div>

                        {/* Right Column - What Came Out of It (40%) */}
                        <div className="lg:w-[40%]">
                            <div className="lg:sticky lg:top-8">
                                <h2 className="text-4xl font-bold tracking-tight mb-8">What Came Out of It</h2>
                                <p className="text-gray-600 mb-8">
                                    Tangible outputs from your work
                                </p>
                                <OutputSection
                                    items={[
                                        // Placeholders for future integrations
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Breakdown Section */}
            {allDomains.length > 0 && (
                <section className="border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-8 py-16">
                        <h2 className="text-4xl font-bold tracking-tight mb-8">Category Breakdown</h2>
                        <p className="text-gray-600 mb-8">
                            Apps grouped by work type
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CategoryBreakdown
                                category="communication"
                                totalSeconds={summary?.communicationSeconds || 0}
                                domains={domainsByCategory.communication}
                            />
                            <CategoryBreakdown
                                category="building"
                                totalSeconds={summary?.buildingSeconds || 0}
                                domains={domainsByCategory.building}
                            />
                            <CategoryBreakdown
                                category="research"
                                totalSeconds={summary?.researchSeconds || 0}
                                domains={domainsByCategory.research}
                            />
                            <CategoryBreakdown
                                category="meetings"
                                totalSeconds={summary?.meetingsSeconds || 0}
                                domains={domainsByCategory.meetings}
                            />
                            <CategoryBreakdown
                                category="admin"
                                totalSeconds={summary?.adminSeconds || 0}
                                domains={domainsByCategory.admin}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Daily Insight */}
            <section>
                <div className="max-w-7xl mx-auto px-8 py-16">
                    <DailyInsight text={generateInsight(summary)} />
                </div>
            </section>
        </main>
    );
}
