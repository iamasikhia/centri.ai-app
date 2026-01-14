'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { BookOpen, Sparkles, FileText, AlertCircle, Loader2, FolderTree, Package, GitBranch, Code2, FileCode, Clock, Lightbulb, MessageCircle, Send, User, Bot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import { MermaidChart } from '@/components/mermaid-chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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

type TabType = 'overview' | 'structure' | 'dependencies' | 'documentation' | 'explanation' | 'ask';

interface CodebaseExplanation {
    productOverview: string;
    targetAudience: string;
    keyComponents: string;
    technicalArchitecture: string;
    howItWorks: string;
    currentDevelopment: string;
    risksAndUnknowns: string;
    executiveSummary: string;
}

export default function CodebaseOverviewPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const userId = 'default-user-id'; // Use default ID to match existing integrations

    // State with sessionStorage persistence
    const [repositories, setRepositories] = useState<Array<{ name: string; fullName: string }>>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>(() => {
        if (typeof window !== 'undefined') return sessionStorage.getItem('codebase_selectedRepo') || '';
        return '';
    });

    const [loading, setLoading] = useState(false);
    const [loadingRepos, setLoadingRepos] = useState(true);

    const [analysis, setAnalysis] = useState<CodebaseAnalysis | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('codebase_analysis');
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    });

    const [explanation, setExplanation] = useState<CodebaseExplanation | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('codebase_explanation');
            return saved ? JSON.parse(saved) : null;
        }
        return null;
    });

    const [loadingExplanation, setLoadingExplanation] = useState(false);

    // Report Generation State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportContent, setReportContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Ask Questions State
    const [questionInput, setQuestionInput] = useState('');
    const [askingQuestion, setAskingQuestion] = useState(false);
    const [qaHistory, setQaHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<TabType>(() => {
        if (typeof window !== 'undefined') {
            return (sessionStorage.getItem('codebase_activeTab') as TabType) || 'ask';
        }
        return 'ask';
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Persistence Effect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('codebase_selectedRepo', selectedRepo);
            sessionStorage.setItem('codebase_activeTab', activeTab);
            if (analysis) sessionStorage.setItem('codebase_analysis', JSON.stringify(analysis));
            if (explanation) sessionStorage.setItem('codebase_explanation', JSON.stringify(explanation));
        }
    }, [selectedRepo, activeTab, analysis, explanation]);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
        if (status === 'authenticated') fetchRepositories();
    }, [status]);

    const fetchRepositories = async () => {
        setLoadingRepos(true);
        try {
            const res = await fetch(`${API_URL}/codebase/repositories`, {
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();

            if (data.error) {
                setError(data.error);
            } else {
                setRepositories(data.repositories || []);
                if (data.repositories && data.repositories.length > 0 && !selectedRepo) {
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
                headers: { 'x-user-id': userId }
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
                    'x-user-id': userId
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

    const handleGenerateReport = async () => {
        if (!selectedRepo) return;

        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/codebase/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({
                    repository: selectedRepo,
                    includeProductData: true,
                    action: 'preview'
                })
            });

            const data = await res.json();
            if (data.error) {
                alert(`Error: ${data.error}`);
                return;
            }

            setReportContent(data.content || '');
        } catch (e: any) {
            alert('Failed to generate report: ' + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportToGoogleDocs = async () => {
        if (!reportContent) return;

        setIsExporting(true);
        try {
            const res = await fetch(`${API_URL}/codebase/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                body: JSON.stringify({
                    repository: selectedRepo,
                    action: 'export',
                    content: reportContent
                })
            });

            const data = await res.json();
            if (data.error) {
                alert(`Error: ${data.error}`);
                return;
            }

            // Open Google Docs in new tab
            if (data.url) {
                window.open(data.url, '_blank');
                setShowReportModal(false);
                setReportContent('');
            }
        } catch (e: any) {
            alert('Failed to export: ' + e.message);
        } finally {
            setIsExporting(false);
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
                                onChange={(e) => {
                                    const newRepo = e.target.value;
                                    if (newRepo !== selectedRepo) {
                                        setSelectedRepo(newRepo);
                                        setAnalysis(null);
                                        setExplanation(null);
                                        sessionStorage.removeItem('codebase_analysis');
                                        sessionStorage.removeItem('codebase_explanation');
                                    }
                                }}
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
                                { id: 'ask', label: 'Ask Questions', icon: MessageCircle },
                                { id: 'explanation', label: 'PM Explanation', icon: Lightbulb },
                                { id: 'overview', label: 'Overview', icon: BookOpen },
                                { id: 'structure', label: 'File Structure', icon: FolderTree },
                                { id: 'dependencies', label: 'Dependencies', icon: Package },
                                { id: 'documentation', label: 'Documentation', icon: FileText },
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
                                    {/* Generate Report Button - Minimalist Design */}
                                    <div className="flex justify-end mb-4">
                                        <Button
                                            onClick={() => {
                                                setShowReportModal(true);
                                                setReportContent('');
                                            }}
                                            variant="outline"
                                            className="gap-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Generate Report
                                        </Button>
                                    </div>

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
                                            title="Technical Architecture"
                                            content={explanation.technicalArchitecture}
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

                    {/* Ask Questions Tab - For Non-Technical PMs */}
                    {activeTab === 'ask' && (
                        <Card className="flex flex-col h-[650px]">
                            <CardHeader className="pb-3 border-b flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <MessageCircle className="w-5 h-5 text-primary" />
                                        Ask Centri About Your Codebase
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Ask questions in plain language — I'll explain without technical jargon.
                                        <span className="text-amber-600 dark:text-amber-400 ml-1 font-medium">(Read-only)</span>
                                    </p>
                                </div>
                                {qaHistory.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setQaHistory([]);
                                            setFollowUpSuggestions([]);
                                        }}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Clear chat
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                                {/* Q&A History */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                                    {qaHistory.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
                                                <Bot className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">Hi! I'm Centri 👋</h3>
                                            <p className="text-sm text-muted-foreground max-w-md mb-6">
                                                I'm here to help you understand your codebase without the tech jargon.
                                                Ask me anything about what the product does, what the team is building, or potential risks.
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 max-w-lg">
                                                {[
                                                    "What does this product do in simple terms?",
                                                    "What are the main features being built?",
                                                    "Are there any technical risks I should know about?",
                                                    "What has the team been working on recently?"
                                                ].map((q, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setQuestionInput(q)}
                                                        className="px-4 py-3 bg-muted/50 hover:bg-muted border hover:border-primary/30 rounded-xl text-sm text-left transition-all"
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {qaHistory.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {msg.role === 'assistant' && (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                                                            <Bot className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                            : 'bg-card border rounded-tl-sm'
                                                            }`}
                                                    >
                                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-0">
                                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                    {msg.role === 'user' && (
                                                        <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center shrink-0">
                                                            <User className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Follow-up Suggestions */}
                                            {!askingQuestion && followUpSuggestions.length > 0 && (
                                                <div className="flex flex-wrap gap-2 ml-11 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    {followUpSuggestions.map((suggestion, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setQuestionInput(suggestion)}
                                                            className="px-3 py-1.5 text-xs bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary rounded-full transition-colors"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {askingQuestion && (
                                        <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                            <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <div className="flex gap-1">
                                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                                    </div>
                                                    <span>Analyzing your codebase...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t bg-muted/20">
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!questionInput.trim() || askingQuestion) return;

                                            const question = questionInput;
                                            setQuestionInput('');
                                            setFollowUpSuggestions([]);

                                            const newHistory = [...qaHistory, { role: 'user' as const, content: question }];
                                            setQaHistory(newHistory);
                                            setAskingQuestion(true);

                                            // Scroll to bottom
                                            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

                                            try {
                                                const res = await fetch(`${API_URL}/codebase/ask`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                                                    body: JSON.stringify({
                                                        repository: selectedRepo,
                                                        question,
                                                        context: explanation ? JSON.stringify(explanation) : null,
                                                        conversationHistory: qaHistory,
                                                        analysisData: analysis
                                                    })
                                                });

                                                const data = await res.json();
                                                const answer = data.answer || "I'm sorry, I couldn't process that question. Please try again.";
                                                setQaHistory(prev => [...prev, { role: 'assistant', content: answer }]);

                                                // Set follow-up suggestions
                                                if (data.followUpSuggestions && data.followUpSuggestions.length > 0) {
                                                    setFollowUpSuggestions(data.followUpSuggestions);
                                                }

                                                // Scroll to bottom after response
                                                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                                            } catch (err) {
                                                setQaHistory(prev => [...prev, {
                                                    role: 'assistant',
                                                    content: "I'm having trouble connecting right now. Please check your connection and try again."
                                                }]);
                                            } finally {
                                                setAskingQuestion(false);
                                            }
                                        }}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            value={questionInput}
                                            onChange={(e) => setQuestionInput(e.target.value)}
                                            placeholder="Ask about features, risks, progress, architecture..."
                                            disabled={askingQuestion}
                                            className="flex-1 bg-background"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.currentTarget.form?.requestSubmit();
                                                }
                                            }}
                                        />
                                        <Button type="submit" disabled={!questionInput.trim() || askingQuestion} size="icon">
                                            {askingQuestion ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </form>
                                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                        Powered by GPT-4o • Responses are explanatory only — no code modifications
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                </div>
            )}

            {/* Report Generation Modal - Clean & Beautiful UI */}
            <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Generate Product Report</h2>
                                <p className="text-sm text-muted-foreground">
                                    Comprehensive analysis with codebase insights and product data
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                        {!reportContent ? (
                            /* Empty State - Beautiful & Inviting */
                            <div className="h-[500px] flex flex-col items-center justify-center p-8">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                    <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                        <Sparkles className="w-12 h-12 text-white" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold mb-3 text-center">
                                    Ready to Create Your Report
                                </h3>

                                <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
                                    Generate a detailed report including executive summary, technical architecture,
                                    active tasks, recent updates, and key decisions from meetings.
                                </p>

                                <Button
                                    onClick={handleGenerateReport}
                                    disabled={isGenerating}
                                    size="lg"
                                    className="gap-2 px-8 h-12 text-base shadow-lg hover:shadow-xl transition-all"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating Report...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate Report
                                        </>
                                    )}
                                </Button>

                                {isGenerating && (
                                    <p className="text-xs text-muted-foreground mt-4 animate-pulse">
                                        This may take a few moments...
                                    </p>
                                )}
                            </div>
                        ) : (
                            /* Report Editor - Clean & Functional */
                            <div className="h-[500px] flex flex-col p-6 gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Report Content</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Edit the markdown content below before exporting
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="px-2 py-1 bg-muted rounded">
                                            {reportContent.length.toLocaleString()} characters
                                        </span>
                                    </div>
                                </div>

                                <Textarea
                                    value={reportContent}
                                    onChange={(e) => setReportContent(e.target.value)}
                                    className="flex-1 font-mono text-sm resize-none border-2 focus:border-blue-500 transition-colors"
                                    placeholder="Your report content will appear here..."
                                />

                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                                    <Lightbulb className="w-4 h-4 text-blue-600" />
                                    <span>
                                        Tip: The report uses Markdown formatting. Headings, lists, and bold text will be preserved in Google Docs.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowReportModal(false);
                                setReportContent('');
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleExportToGoogleDocs}
                            disabled={!reportContent || isExporting}
                            className="gap-2 px-6"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Export to Google Docs
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-li:my-0.5">
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const isMermaid = match && match[1] === 'mermaid';

                                if (!inline && isMermaid) {
                                    return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
                                }

                                return (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    );
}
