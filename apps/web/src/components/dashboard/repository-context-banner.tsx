import { Github, Users, GitBranch, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RepositoryContextBannerProps {
    repository: string;
    githubData?: {
        commits: any[];
        prs: any[];
        releases: any[];
    };
}

export function RepositoryContextBanner({ repository, githubData }: RepositoryContextBannerProps) {
    // Calculate repository stats
    const getRepoStats = () => {
        if (!githubData || repository === 'All') {
            const repoCount = githubData ?
                new Set([
                    ...githubData.commits.map(c => c.repo),
                    ...githubData.prs.map(p => p.repo),
                    ...githubData.releases.map(r => r.repo)
                ].filter(Boolean)).size : 0;

            return {
                type: 'Organization View',
                repositories: repoCount,
                contributors: new Set([
                    ...(githubData?.commits || []).map(c => c.author),
                    ...(githubData?.prs || []).map(p => p.author)
                ].filter(Boolean)).size,
                lastActivity: getLastActivityTime(githubData),
                branch: null
            };
        }

        // Repository-specific stats
        const contributors = new Set([
            ...githubData.commits.map(c => c.author),
            ...githubData.prs.map(p => p.author)
        ].filter(Boolean)).size;

        return {
            type: getRepositoryType(repository),
            repositories: 1,
            contributors,
            lastActivity: getLastActivityTime(githubData),
            branch: 'main'
        };
    };

    const getRepositoryType = (repo: string): string => {
        // Infer repository type from name
        if (repo.includes('frontend') || repo.includes('web') || repo.includes('ui')) {
            return 'Frontend Application';
        }
        if (repo.includes('backend') || repo.includes('api') || repo.includes('server')) {
            return 'Backend Service';
        }
        if (repo.includes('mobile') || repo.includes('ios') || repo.includes('android')) {
            return 'Mobile Application';
        }
        if (repo.includes('infra') || repo.includes('terraform') || repo.includes('k8s')) {
            return 'Infrastructure';
        }
        return 'Repository';
    };

    const getLastActivityTime = (data?: { commits: any[]; prs: any[]; releases: any[] }) => {
        if (!data) return null;

        const allDates = [
            ...data.commits.map(c => new Date(c.date)),
            ...data.prs.map(p => new Date(p.created_at)),
            ...data.releases.map(r => new Date(r.published_at))
        ].filter(d => !isNaN(d.getTime()));

        if (allDates.length === 0) return null;

        const mostRecent = new Date(Math.max(...allDates.map(d => d.getTime())));
        return mostRecent;
    };

    const stats = getRepoStats();
    const githubUrl = repository !== 'All'
        ? `https://github.com/your-org/${repository}`
        : 'https://github.com/your-org';

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Github className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-bold">
                            {repository === 'All' ? 'All Repositories' : repository}
                        </h3>
                        {repository !== 'All' && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                {stats.type}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        {repository === 'All' && stats.repositories > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Github className="w-4 h-4" />
                                <span>{stats.repositories} repositories</span>
                            </div>
                        )}

                        {stats.contributors > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>
                                    {stats.contributors} active {stats.contributors === 1 ? 'contributor' : 'contributors'} this week
                                </span>
                            </div>
                        )}

                        {stats.branch && (
                            <div className="flex items-center gap-1.5">
                                <GitBranch className="w-4 h-4" />
                                <span className="font-mono text-xs">{stats.branch}</span>
                                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs rounded">
                                    protected
                                </span>
                            </div>
                        )}

                        {stats.lastActivity && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                <span>
                                    Last activity: {formatDistanceToNow(stats.lastActivity, { addSuffix: true })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted border rounded-lg text-sm font-medium transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View on GitHub
                    </a>
                </div>
            </div>
        </div>
    );
}
