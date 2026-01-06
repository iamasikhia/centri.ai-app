import { Injectable } from '@nestjs/common';
import { differenceInDays, parseISO, startOfWeek, subDays } from 'date-fns';

@Injectable()
export class GithubIntelligenceService {

    processActivity(activity: any) {
        const { commits, prs, releases } = activity;

        const weeklyBrief = this.generateWeeklyBrief(commits, prs, releases);
        const metrics = this.calculateMetrics(commits, prs, releases);
        const initiatives = this.clusterInitiatives(prs, commits);
        const risks = this.detectRisks(prs, commits); // Only PRs and Commits needed for risk

        const repositories = Array.from(new Set([
            ...commits.map((c: any) => c.repo),
            ...prs.map((p: any) => p.repo)
        ]));

        return {
            weeklyBrief,
            metrics,
            initiatives,
            risks,
            repositories,
            rawData: { commits, prs, releases }
        };
    }

    private generateWeeklyBrief(commits: any[], prs: any[], releases: any[]): string {
        const mergedPRs = prs.filter((p: any) => p.merged);
        const openPRs = prs.filter((p: any) => p.state === 'open');
        const recentReleases = releases.filter((r: any) => differenceInDays(new Date(), parseISO(r.published_at)) < 7);

        let brief = `This week, engineering merged ${mergedPRs.length} pull requests or "Engineering Changes" across ${new Set(commits.map((c: any) => c.repo)).size} repositories. `;

        if (recentReleases.length > 0) {
            brief += `${recentReleases.length} "Product Updates Shipped" (releases) went live, including ${recentReleases[0].name || recentReleases[0].tag}. `;
        } else {
            brief += "No production releases were shipped this week. ";
        }

        if (openPRs.length > 0) {
            brief += `${openPRs.length} items are currently in progress. `;
        }

        // Momentum heuristic
        const commitsLast3Days = commits.filter((c: any) => differenceInDays(new Date(), parseISO(c.date)) <= 3).length;
        if (commitsLast3Days > 10) {
            brief += "Development momentum is high.";
        } else if (commitsLast3Days > 0) {
            brief += "Momentum is stable.";
        } else {
            brief += "Activity has slowed recently.";
        }

        return brief;
    }

    private calculateMetrics(commits: any[], prs: any[], releases: any[]) {
        // Current Period (Last 7 days)
        const commitsLast7d = commits.filter((c: any) => differenceInDays(new Date(), parseISO(c.date)) <= 7).length;
        const mergedLast7d = prs.filter((p: any) => p.merged && differenceInDays(new Date(), parseISO(p.merged_at)) <= 7).length;
        const releasesLast7d = releases.filter((r: any) => differenceInDays(new Date(), parseISO(r.published_at)) <= 7).length;

        // Previous Period (7-14 days) - Heuristic from data (since we only fetch 14d)
        const commitsPrev7d = commits.filter((c: any) => {
            const d = differenceInDays(new Date(), parseISO(c.date));
            return d > 7 && d <= 14;
        }).length;

        return [
            {
                id: 'repo-updates',
                title: 'Repository Updates',
                value: commitsLast7d,
                trendDirection: commitsLast7d >= commitsPrev7d ? 'up' : 'down',
                trendLabel: commitsPrev7d ? `${Math.round(((commitsLast7d - commitsPrev7d) / commitsPrev7d) * 100)}%` : 'New',
                description: 'Code commits to main branches.'
            },
            {
                id: 'eng-changes',
                title: 'Engineering Changes',
                value: mergedLast7d,
                trendDirection: 'flat', // Simplified for MVP
                trendLabel: 'Stable',
                description: 'Merged Pull Requests.'
            },
            {
                id: 'shipped',
                title: 'Product Updates Shipped',
                value: releasesLast7d,
                trendDirection: releasesLast7d > 0 ? 'up' : 'flat',
                trendLabel: releasesLast7d > 0 ? 'Active' : 'None',
                description: 'New versions released.'
            }
        ];
    }

    private clusterInitiatives(prs: any[], commits: any[]) {
        // Naive clustering by analyzing titles for repeated meaningful words
        // Or simpler: Group by Repo + Type (feat/fix)
        const initiatives: any[] = [];
        const keywords = ['feat', 'fix', 'refactor', 'ui', 'api', 'docs'];

        // Group PRs by keyword
        keywords.forEach(kw => {
            const relatedPRs = prs.filter((p: any) => p.title.toLowerCase().includes(kw));
            if (relatedPRs.length > 0) {
                const openCount = relatedPRs.filter((p: any) => p.state === 'open').length;
                const mergedCount = relatedPRs.filter((p: any) => p.merged).length;
                const total = openCount + mergedCount;
                const completion = total > 0 ? Math.round((mergedCount / total) * 100) : 0;

                // Status logic
                let status = 'On Track';
                if (openCount > 0 && completion < 20) status = 'At Risk';
                if (openCount > 0 && relatedPRs.some((p: any) => differenceInDays(new Date(), parseISO(p.created_at)) > 7)) status = 'Blocked';

                let name = kw === 'ui' ? 'User Interface Improvements' :
                    kw === 'api' ? 'API Enhancements' :
                        kw === 'feat' ? 'Feature Development' :
                            kw === 'fix' ? 'Bug Fixes' :
                                kw.charAt(0).toUpperCase() + kw.slice(1) + ' Work';

                // Add repo name if diverse
                const repos = new Set(relatedPRs.map((p: any) => p.repo));
                if (repos.size === 1) {
                    name += ` (${Array.from(repos)[0]})`;
                }

                initiatives.push({
                    id: `init-${kw}`,
                    name,
                    status,
                    completion,
                    aiExplanation: `${mergedCount} merged, ${openCount} active. Recent work on ${Array.from(repos).join(', ')}.`
                });
            }
        });

        if (initiatives.length === 0) {
            // Fallback
            initiatives.push({
                id: 'general-maint',
                name: 'General Maintenance',
                status: 'On Track',
                completion: 100,
                aiExplanation: 'Routine codebase updates.'
            });
        }

        return initiatives.slice(0, 4); // Limit to top 4
    }

    private detectRisks(prs: any[], commits: any[]) {
        const risks: any[] = [];

        // 1. Stale PRs
        const stalePRs = prs.filter((p: any) => p.state === 'open' && differenceInDays(new Date(), parseISO(p.created_at)) > 7);
        stalePRs.forEach((p: any) => {
            risks.push({
                id: `stale-${p.url}`,
                text: `Blocked Enigneering Item: "${p.title}" open > 7 days`,
                severity: 'Medium',
                type: 'Stale Work'
            });
        });

        // 2. Momentum Drop
        const commitsLast3d = commits.filter((c: any) => differenceInDays(new Date(), parseISO(c.date)) <= 3).length;
        if (commitsLast3d === 0) {
            risks.push({
                id: 'low-momentum',
                text: 'Momentum Risk: No repository updates in 3 days.',
                severity: 'High',
                type: 'Inactivity'
            });
        }

        return risks;
    }
}
