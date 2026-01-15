import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Goal definitions for analytics
const GOAL_LABELS: Record<string, string> = {
    'engineering-tracking': 'Track Engineering Team',
    'slack-checkins': 'Slack Check-ins',
    'meeting-prep': 'Meeting Preparation',
    'codebase-understanding': 'Understand Codebase',
    'stakeholder-updates': 'Stakeholder Updates',
    'decision-tracking': 'Decision Tracking'
};

// Integration definitions for analytics
const INTEGRATION_LABELS: Record<string, string> = {
    'google-calendar': 'Google Calendar',
    'gmail': 'Gmail',
    'slack': 'Slack',
    'github': 'GitHub',
    'google-drive': 'Google Drive',
    'google-docs': 'Google Docs',
    'fathom': 'Fathom',
    'zoom': 'Zoom'
};

@Injectable()
export class OnboardingService {
    constructor(private prisma: PrismaService) { }

    async saveResponse(data: {
        userId: string;
        userEmail?: string;
        selectedGoals: string[];
        selectedIntegrations: string[];
    }) {
        const response = await this.prisma.onboardingResponse.create({
            data: {
                userId: data.userId,
                userEmail: data.userEmail,
                selectedGoals: data.selectedGoals,
                selectedIntegrations: data.selectedIntegrations
            }
        });

        return {
            success: true,
            id: response.id,
            message: 'Onboarding response saved successfully'
        };
    }

    async getAllResponses() {
        const responses = await this.prisma.onboardingResponse.findMany({
            orderBy: { completedAt: 'desc' },
            take: 100
        });

        return responses.map(r => ({
            id: r.id,
            userId: r.userId,
            userEmail: r.userEmail,
            selectedGoals: r.selectedGoals as string[],
            selectedGoalLabels: (r.selectedGoals as string[]).map(g => GOAL_LABELS[g] || g),
            selectedIntegrations: r.selectedIntegrations as string[],
            selectedIntegrationLabels: (r.selectedIntegrations as string[]).map(i => INTEGRATION_LABELS[i] || i),
            completedAt: r.completedAt
        }));
    }

    async getStats() {
        const total = await this.prisma.onboardingResponse.count();
        const responses = await this.prisma.onboardingResponse.findMany();

        // Count goal popularity
        const goalCounts: Record<string, number> = {};
        const integrationCounts: Record<string, number> = {};

        responses.forEach(r => {
            const goals = r.selectedGoals as string[];
            const integrations = r.selectedIntegrations as string[];

            goals.forEach(g => {
                goalCounts[g] = (goalCounts[g] || 0) + 1;
            });

            integrations.forEach(i => {
                integrationCounts[i] = (integrationCounts[i] || 0) + 1;
            });
        });

        // Format goal stats
        const goalStats = Object.entries(goalCounts)
            .map(([id, count]) => ({
                id,
                label: GOAL_LABELS[id] || id,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

        // Format integration stats
        const integrationStats = Object.entries(integrationCounts)
            .map(([id, count]) => ({
                id,
                label: INTEGRATION_LABELS[id] || id,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

        // Recent completions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = await this.prisma.onboardingResponse.count({
            where: { completedAt: { gte: sevenDaysAgo } }
        });

        return {
            totalResponses: total,
            recentCompletions: recentCount,
            goalStats,
            integrationStats,
            avgGoalsSelected: total > 0
                ? Math.round(responses.reduce((acc, r) => acc + (r.selectedGoals as string[]).length, 0) / total * 10) / 10
                : 0,
            avgIntegrationsSelected: total > 0
                ? Math.round(responses.reduce((acc, r) => acc + (r.selectedIntegrations as string[]).length, 0) / total * 10) / 10
                : 0
        };
    }
}
