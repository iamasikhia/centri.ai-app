import { formatDistanceToNow, parseISO } from 'date-fns';
import { GitCommit, GitMerge, GitPullRequest, Rocket, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentActivityFeedProps {
    githubData: {
        commits: any[];
        prs: any[];
        releases: any[];
    };
    repository: string;
}

type ActivityItem = {
    id: string;
    type: 'commit' | 'pr_opened' | 'pr_merged' | 'pr_closed' | 'release';
    timestamp: Date;
    title: string;
    author: string;
    url: string;
    repo?: string;
    additions?: number;
    deletions?: number;
    filesChanged?: number;
    metadata?: Record<string, any>;
};

export function RecentActivityFeed({ githubData, repository }: RecentActivityFeedProps) {
    // Combine and sort all activity
    const activities: ActivityItem[] = [];

    // Add commits
    githubData.commits.forEach((commit: any) => {
        activities.push({
            id: `commit-${commit.sha}`,
            type: 'commit',
            timestamp: parseISO(commit.date),
            title: commit.message?.split('\n')[0] || 'Commit',
            author: commit.author,
            url: commit.url,
            repo: commit.repo,
            metadata: { sha: commit.sha?.substring(0, 7) }
        });
    });

    // Add PRs
    githubData.prs.forEach((pr: any) => {
        if (pr.merged) {
            activities.push({
                id: `pr-merged-${pr.number}`,
                type: 'pr_merged',
                timestamp: parseISO(pr.merged_at),
                title: pr.title,
                author: pr.author,
                url: pr.url,
                repo: pr.repo,
                additions: pr.additions,
                deletions: pr.deletions,
                filesChanged: pr.changed_files,
                metadata: { number: pr.number, merged_by: pr.merged_by }
            });
        } else if (pr.state === 'open') {
            activities.push({
                id: `pr-open-${pr.number}`,
                type: 'pr_opened',
                timestamp: parseISO(pr.created_at),
                title: pr.title,
                author: pr.author,
                url: pr.url,
                repo: pr.repo,
                additions: pr.additions,
                deletions: pr.deletions,
                metadata: { number: pr.number, reviews: pr.requested_reviewers?.length || 0 }
            });
        } else if (pr.state === 'closed') {
            activities.push({
                id: `pr-closed-${pr.number}`,
                type: 'pr_closed',
                timestamp: parseISO(pr.closed_at),
                title: pr.title,
                author: pr.author,
                url: pr.url,
                repo: pr.repo,
                metadata: { number: pr.number }
            });
        }
    });

    // Add releases
    githubData.releases.forEach((release: any) => {
        activities.push({
            id: `release-${release.id}`,
            type: 'release',
            timestamp: parseISO(release.published_at),
            title: release.name || release.tag_name,
            author: release.author,
            url: release.url,
            repo: release.repo,
            metadata: { tag: release.tag_name, prerelease: release.prerelease }
        });
    });

    // Sort by timestamp (newest first)
    const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10); // Show last 10 items

    if (sortedActivities.length === 0) {
        return (
            <div className="py-12 text-center">
                <div className="text-muted-foreground text-sm">
                    No recent activity in the last 7 days
                    {repository !== 'All' && (
                        <div className="mt-1">for <span className="font-medium">{repository}</span></div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground/60 mt-2">
                    Push commits, open PRs, or ship releases to see activity here
                </p>
            </div>
        );
    }

    return (
        <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
            {sortedActivities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} showRepo={repository === 'All'} />
            ))}
        </div>
    );
}

function ActivityRow({ activity, showRepo }: { activity: ActivityItem; showRepo: boolean }) {
    const getIcon = () => {
        switch (activity.type) {
            case 'commit':
                return <GitCommit className="w-4 h-4 text-blue-500" />;
            case 'pr_opened':
                return <GitPullRequest className="w-4 h-4 text-green-500" />;
            case 'pr_merged':
                return <GitMerge className="w-4 h-4 text-purple-500" />;
            case 'pr_closed':
                return <GitPullRequest className="w-4 h-4 text-red-500" />;
            case 'release':
                return <Rocket className="w-4 h-4 text-amber-500" />;
            default:
                return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getTypeLabel = () => {
        switch (activity.type) {
            case 'commit':
                return 'Commit';
            case 'pr_opened':
                return 'PR opened';
            case 'pr_merged':
                return 'PR merged';
            case 'pr_closed':
                return 'PR closed';
            case 'release':
                return 'Release';
            default:
                return 'Activity';
        }
    };

    const getBgColor = () => {
        switch (activity.type) {
            case 'commit':
                return 'bg-blue-50 dark:bg-blue-950/30';
            case 'pr_opened':
                return 'bg-green-50 dark:bg-green-950/30';
            case 'pr_merged':
                return 'bg-purple-50 dark:bg-purple-950/30';
            case 'pr_closed':
                return 'bg-red-50 dark:bg-red-950/30';
            case 'release':
                return 'bg-amber-50 dark:bg-amber-950/30';
            default:
                return 'bg-muted/30';
        }
    };

    return (
        <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "block p-3 rounded-lg border transition-all hover:shadow-sm hover:border-blue-400",
                getBgColor()
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon()}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {getTypeLabel()}
                                </span>
                                {activity.metadata?.number && (
                                    <span className="text-xs text-muted-foreground/60">
                                        #{activity.metadata.number}
                                    </span>
                                )}
                                {/* SHA removed for PM friendliness unless it's the only identifier */}
                                {activity.type === 'commit' && !activity.metadata?.number && (
                                    <span className="text-xs font-mono text-muted-foreground/40">
                                        Commit
                                    </span>
                                )}
                                {showRepo && activity.repo && (
                                    <span className="text-xs px-1.5 py-0.5 bg-background/80 rounded border text-muted-foreground">
                                        {activity.repo}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-medium mt-1 line-clamp-2">
                                {activity.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                <span>{activity.author}</span>
                                {(activity.additions !== undefined || activity.deletions !== undefined) && (
                                    <>
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            +{activity.additions || 0}
                                        </span>
                                        <span className="text-red-600 dark:text-red-400">
                                            -{activity.deletions || 0}
                                        </span>
                                        {activity.filesChanged && (
                                            <span className="text-muted-foreground/60">
                                                {activity.filesChanged} {activity.filesChanged === 1 ? 'file' : 'files'}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
}
