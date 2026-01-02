import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, summary, activities } = body;

        if (!userId || !summary) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Ensure user exists (stub auth)
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: userId,
                    email: `${userId}@centri.local` // Stub email
                }
            });
        }

        const date = startOfDay(new Date(summary.date));

        // Upsert daily summary
        const dailySummary = await prisma.dailySummary.upsert({
            where: {
                userId_date: {
                    userId: user.id,
                    date
                }
            },
            update: {
                totalActiveSeconds: summary.totalActiveSeconds,
                communicationSeconds: summary.categoryTotals.communication,
                buildingSeconds: summary.categoryTotals.building,
                researchSeconds: summary.categoryTotals.research,
                meetingsSeconds: summary.categoryTotals.meetings,
                adminSeconds: summary.categoryTotals.admin,
                focusWindowStart: summary.focusWindow ? new Date(summary.focusWindow.start) : null,
                focusWindowEnd: summary.focusWindow ? new Date(summary.focusWindow.end) : null,
                topDomains: JSON.stringify(summary.topDomains),
                contextSwitchCount: summary.contextSwitchCount
            },
            create: {
                userId: user.id,
                date,
                totalActiveSeconds: summary.totalActiveSeconds,
                communicationSeconds: summary.categoryTotals.communication,
                buildingSeconds: summary.categoryTotals.building,
                researchSeconds: summary.categoryTotals.research,
                meetingsSeconds: summary.categoryTotals.meetings,
                adminSeconds: summary.categoryTotals.admin,
                focusWindowStart: summary.focusWindow ? new Date(summary.focusWindow.start) : null,
                focusWindowEnd: summary.focusWindow ? new Date(summary.focusWindow.end) : null,
                topDomains: JSON.stringify(summary.topDomains),
                contextSwitchCount: summary.contextSwitchCount
            }
        });

        // Save activity logs
        if (activities && activities.length > 0) {
            // Delete existing activities for this day to avoid duplicates
            await prisma.activityLog.deleteMany({
                where: {
                    dailySummaryId: dailySummary.id
                }
            });

            // Insert new activities
            await prisma.activityLog.createMany({
                data: activities.map((activity: any) => ({
                    dailySummaryId: dailySummary.id,
                    domain: activity.domain,
                    category: activity.category,
                    durationSeconds: activity.durationSeconds,
                    timestamp: new Date(activity.timestamp)
                }))
            });
        }

        return NextResponse.json({
            success: true,
            dailySummaryId: dailySummary.id
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
