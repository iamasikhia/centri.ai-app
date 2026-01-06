'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { BookOpen, Sparkles, FileText, AlertCircle, Loader2, FolderTree, Package, GitBranch, Code2, FileCode, Clock, Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CodebaseAnalysis {
    repository: string;
    defaultBranch: string;
    languages: { [key: string]: number };
    fileTree: Array<{ path: string; type: string; size?: number }>;
    dependencies: Array<{ name: string; version: string; type: string }>;
    readme: string;
    documentation: { [path: string]: string };
    recentCommits: Array<{
        sha: string;
        message: string;
        author: string;
        date: string;
    }>;
}

type TabType = 'overview' | 'structure' | 'dependencies' | 'documentation' | 'explanation';

interface CodebaseExplanation {
    productOverview: string;
    targetAudience: string;
    keyComponents: string;
    howItWorks: string;
    currentDevelopment: string;
    risksAndUnknowns: string;
    executiveSummary: string;
}

export default function CodebaseOverviewPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [repositories, setRepositories] = useState<Array<{ name: string; fullName: string }>>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingRepos, setLoadingRepos] = useState(true);
    const [analysis, setAnalysis] = useState<CodebaseAnalysis | null>(null);
    const [explanation, setExplanation] = useState<CodebaseExplanation | null>(null);
    const [loadingExplanation, setLoadingExplanation] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
        if (status === 'authenticated') fetchRepositories();
    }, [status]);

    const fetchRepositories = async () => {
        setLoadingRepos(true);
        try {
            const res = await fetch(`${API_URL}/codebase/repositories`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setRepositories(data.repositories || []);
                if (data.repositories && data.repositories.length > 0) {
                    setSelectedRepo(data.repositories[0].fullName);
                }
            }
        } catch (e) {
            console.error('Failed to fetch repositories', e);
            setError('Failed to load repositories. Please check your GitHub connection.');
        } finally {
            setLoadingRepos(false);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedRepo) return;

        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const res = await fetch(`${API_URL}/codebase/analyze?repository=${encodeURIComponent(selectedRepo)}`, {
                headers: { 'x-user-id': 'default-user-id' }
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error + (data.details ? `: ${data.details}` : ''));
            } else {
                setAnalysis(data.analysis);
            }
        } catch (e) {
            console.error('Failed to analyze codebase', e);
            setError('Failed to analyze repository. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchExplanation = async () => {
        if (!selectedRepo || !analysis) return;

        setLoadingExplanation(true);
        try {
            const res = await fetch(`${API_URL}/codebase/explain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id'
                },
                body: JSON.stringify({ repository: selectedRepo })
            });

            const data = await res.json();

            if (data.error) {
                console.error('Explanation failed:', data.error);
            } else {
                setExplanation(data.explanation);
            }
        } catch (e) {
            console.error('Failed to fetch explanation', e);
        } finally {
            setLoadingExplanation(false);
        }
    };


    if (status === 'loading' || loadingRepos) {
        return (
            <div className="p-8 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-12 w-96" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const totalBytes = Object.values(analysis?.languages || {}).reduce((a, b) => a + b, 0);

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Code2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Codebase Intelligence</h1>
                        <p className="text-muted-foreground">Explore and understand your codebase structure</p>
                    </div>
                </div>
            </div>

            {/* Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Select Repository</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && !analysis && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    Make sure GitHub is connected in Settings → Integrations
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Repository</label>
                            <NativeSelect
                                value={selectedRepo}
                                onChange={(e) => setSelectedRepo(e.target.value)}
                                disabled={repositories.length === 0 || loading}
                            >
                                {repositories.length === 0 ? (
                                    <option>No repositories found</option>
                                ) : (
                                    repositories.map(repo => (
                                        <option key={repo.fullName} value={repo.fullName}>
                                            {repo.fullName}
                                        </option>
                                    ))
                                )}
                            </NativeSelect>
                        </div>
                        <Button
                            onClick={handleAnalyze}
                            disabled={!selectedRepo || loading || repositories.length === 0}
                            className="gap-2"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Analyze Repository
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
                <Card className="border-violet-200 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4">
                            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                            <div>
                                <p className="font-semibold text-lg">Analyzing repository...</p>
                                <p className="text-sm text-muted-foreground">Extracting structure, dependencies, and documentation</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Analysis Results */}
            {analysis && !loading && (
                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="border-b">
                        <div className="flex gap-6">
                            {[
                                { id: 'overview', label: 'Overview', icon: BookOpen },
                                { id: 'structure', label: 'File Structure', icon: FolderTree },
                                { id: 'dependencies', label: 'Dependencies', icon: Package },
                                { id: 'documentation', label: 'Documentation', icon: FileText },
                                { id: 'explanation', label: 'PM Explanation', icon: Lightbulb },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-primary text-primary font-medium'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Repository Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GitBranch className="w-5 h-5" />
                                        Repository Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Repository</p>
                                            <p className="font-mono text-sm font-medium">{analysis.repository}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Default Branch</p>
                                            <p className="font-mono text-sm font-medium">{analysis.defaultBranch}</p>
                                        </div>
                                    </div>

                                    {/* Languages */}
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Languages</p>
                                        <div className="space-y-2">
                                            {Object.entries(analysis.languages).map(([lang, bytes]) => (
                                                <div key={lang} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">{lang}</span>
                                                        <span className="text-muted-foreground">
                                                            {((bytes / totalBytes) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${(bytes / totalBytes) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* README */}
                            {analysis.readme && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileCode className="w-5 h-5" />
                                            README
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
                                                {analysis.readme}
                                            </pre>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Recent Commits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {analysis.recentCommits.map(commit => (
                                            <div key={commit.sha} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                <code className="text-xs bg-muted px-2 py-1 rounded">{commit.sha}</code>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{commit.message}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {commit.author} • {new Date(commit.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'structure' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>File Structure</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 max-h-[600px] overflow-auto font-mono text-sm">
                                    {analysis.fileTree.slice(0, 100).map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 py-1 hover:bg-muted/50 px-2 rounded">
                                            {file.type === 'directory' ? (
                                                <FolderTree className="w-4 h-4 text-blue-500" />
                                            ) : (
                                                <FileCode className="w-4 h-4 text-muted-foreground" />
                                            )}
                                            <span className={file.type === 'directory' ? 'font-medium' : ''}>
                                                {file.path}
                                            </span>
                                            {file.size && (
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {analysis.fileTree.length > 100 && (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                            ... and {analysis.fileTree.length - 100} more files
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'dependencies' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Dependencies</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analysis.dependencies.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No dependencies found</p>
                                ) : (
                                    <div className="space-y-4">
                                        {['production', 'development'].map(type => {
                                            const deps = analysis.dependencies.filter(d => d.type === type);
                                            if (deps.length === 0) return null;

                                            return (
                                                <div key={type}>
                                                    <h3 className="text-sm font-semibold mb-3 capitalize">{type} Dependencies</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {deps.map(dep => (
                                                            <div key={dep.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                                <span className="font-mono text-sm font-medium">{dep.name}</span>
                                                                <span className="text-xs text-muted-foreground font-mono">{dep.version}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'documentation' && (
                        <div className="space-y-4">
                            {Object.keys(analysis.documentation).length === 0 ? (
                                <Card>
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        No additional documentation files found
                                    </CardContent>
                                </Card>
                            ) : (
                                Object.entries(analysis.documentation).map(([path, content]) => (
                                    <Card key={path}>
                                        <CardHeader>
                                            <CardTitle className="text-base font-mono">{path}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
                                                {content}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'explanation' && (
                        <div className="space-y-6">
                            {!explanation ? (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Generate PM-Friendly Explanation</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Get an AI-powered explanation of this codebase in plain business language
                                        </p>
                                        <Button onClick={fetchExplanation} disabled={loadingExplanation} className="gap-2">
                                            {loadingExplanation ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating Explanation...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4" />
                                                    Explain to PM
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    {/* Executive Summary - Highlighted */}
                                    <Card className="border-emerald-200 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                                                <Sparkles className="w-5 h-5" />
                                                Executive Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-base leading-relaxed text-foreground/90">
                                                {explanation.executiveSummary}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Main Sections */}
                                    <div className="grid gap-6">
                                        <ExplanationSection
                                            title="Product Overview"
                                            content={explanation.productOverview}
                                        />
                                        <ExplanationSection
                                            title="Target Audience"
                                            content={explanation.targetAudience}
                                        />
                                        <ExplanationSection
                                            title="Key Components"
                                            content={explanation.keyComponents}
                                        />
                                        <ExplanationSection
                                            title="How It Works"
                                            content={explanation.howItWorks}
                                        />
                                        <ExplanationSection
                                            title="Current Development Focus"
                                            content={explanation.currentDevelopment}
                                        />
                                        <ExplanationSection
                                            title="Risks & Unknowns"
                                            content={explanation.risksAndUnknowns}
                                            variant="warning"
                                        />
                                    </div>

                                    {/* Copy Helper */}
                                    <Card className="bg-muted/30">
                                        <CardContent className="p-4">
                                            <p className="text-sm text-muted-foreground">
                                                💡 <strong>Tip:</strong> This summary is ready to copy-paste into stakeholder updates, board decks, or leadership presentations.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Helper component for explanation sections
function ExplanationSection({ title, content, variant = 'default' }: { title: string; content: string; variant?: 'default' | 'warning' }) {
    return (
        <Card className={variant === 'warning' ? 'border-amber-200 dark:border-amber-900/30' : ''}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            </CardContent>
        </Card>
    );
}
