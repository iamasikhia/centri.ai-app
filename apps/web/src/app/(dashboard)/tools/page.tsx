'use client';

import { useState } from 'react';
import { pmToolsData, type Category, type Tool, type CompanyStage } from '@/data/pm-tools';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ExternalLink, Building2, Rocket, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

const stageIcons: Record<CompanyStage, React.ReactNode> = {
    'Startup': <Rocket className="w-3 h-3" />,
    'Scaleup': <Building2 className="w-3 h-3" />,
    'Enterprise': <Building className="w-3 h-3" />,
    'All': null
};

const stageBadgeColors: Record<CompanyStage, string> = {
    'Startup': 'bg-green-100 text-green-700 border-green-200',
    'Scaleup': 'bg-blue-100 text-blue-700 border-blue-200',
    'Enterprise': 'bg-purple-100 text-purple-700 border-purple-200',
    'All': 'bg-gray-100 text-gray-700 border-gray-200'
};

const ToolDetailsModal = ({ tool, onClose }: { tool: Tool; onClose: () => void }) => {
    if (!tool) return null;

    // Close on escape key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
            onKeyDown={handleKeyDown}
        >
            <div
                className="bg-background rounded-xl border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b flex items-start justify-between gap-4 sticky top-0 bg-background z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white border flex items-center justify-center shrink-0 p-3 shadow-sm">
                            <img src={tool.logo || `https://ui-avatars.com/api/?name=${tool.name}`} alt={tool.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{tool.name}</h2>
                            <p className="text-muted-foreground">{tool.primaryUse}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-muted/40 rounded-lg border">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pricing</div>
                            <div className="font-medium">{tool.pricing || 'Unknown'}</div>
                        </div>
                        <div className="p-3 bg-muted/40 rounded-lg border">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rating</div>
                            <div className="font-medium flex items-center gap-1">
                                <span className="text-yellow-500">★</span> {tool.rating?.toFixed(1) || '-'}
                            </div>
                        </div>
                        <div className="col-span-2 p-3 bg-muted/40 rounded-lg border">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Stage</div>
                            <div className="flex flex-wrap gap-1">
                                {tool.bestForStage.map(s => <span key={s} className="px-1.5 py-0.5 bg-background rounded border text-xs">{s}</span>)}
                            </div>
                        </div>
                    </div>

                    {/* Deep Directions */}
                    <div className="space-y-4">
                        <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <Rocket className="w-5 h-5 text-primary" />
                                Common Use Case
                            </h3>
                            <p className="text-muted-foreground leading-relaxed p-4 bg-muted/20 rounded-lg border">
                                {tool.commonScenario}
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                How to Use
                            </h3>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>To get the most out of {tool.name}, product teams typically:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Integrate it with their existing stack (e.g. referencing data from {tool.name} in other docs).</li>
                                    <li>Use it during the <strong>{tool.primaryUse.toLowerCase()}</strong> phase of the product lifecycle.</li>
                                    <li>Adopt it to solve specific pain points around scale and collaboration fit for <strong>{tool.bestForStage.join('/')}</strong> companies.</li>
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:underline">Close</button>
                    {tool.website && (
                        <a
                            href={tool.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 flex items-center gap-2"
                        >
                            Visit Website <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

function ToolCard({ tool, onDetailsClick }: { tool: Tool; onDetailsClick: (t: Tool) => void }) {
    const domain = tool.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    // Cascading fallback URLs
    const getFallbackUrl = (attemptNumber: number) => {
        switch (attemptNumber) {
            case 1: return tool.logo; // Primary: Direct logo URL
            case 2: return `https://logo.clearbit.com/${domain}`; // Clearbit
            case 3: return `https://img.logo.dev/${domain}?token=pk_X-1ZO13CQEaRs8nLFcRsPA`; // Logo.dev
            case 4: return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`; // Google favicons
            default: return `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=6366f1&color=fff&size=128&bold=true`; // Final fallback
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const currentAttempt = parseInt(img.dataset.attempt || '1');

        if (currentAttempt < 5) {
            img.dataset.attempt = String(currentAttempt + 1);
            img.src = getFallbackUrl(currentAttempt + 1) || '';
        }
    };

    const pricingColors = {
        'Free': 'bg-green-100 text-green-700 border-green-200',
        'Freemium': 'bg-blue-100 text-blue-700 border-blue-200',
        'Paid': 'bg-orange-100 text-orange-700 border-orange-200',
        'Enterprise': 'bg-purple-100 text-purple-700 border-purple-200'
    };

    return (
        <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 group flex flex-col">
            <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center shrink-0 p-1.5 shadow-sm">
                        <img
                            src={getFallbackUrl(1) || ''}
                            alt={`${tool.name} logo`}
                            className="w-full h-full object-contain"
                            data-attempt="1"
                            onError={handleImageError}
                            loading="lazy"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                                {tool.name}
                            </h3>
                            {tool.website && (
                                <a
                                    href={tool.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-accent rounded-md transition-colors shrink-0"
                                    title="Visit website"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                </a>
                            )}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {tool.primaryUse}
                        </p>

                        {/* Rating and Pricing */}
                        {(tool.rating || tool.pricing) && (
                            <div className="flex items-center gap-2 mt-1.5">
                                {tool.rating && (
                                    <div className="flex items-center gap-1">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg
                                                    key={star}
                                                    className={cn(
                                                        "w-3 h-3",
                                                        star <= Math.round(tool.rating!)
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-gray-300 fill-gray-300"
                                                    )}
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {tool.rating.toFixed(1)}
                                            {tool.reviewCount && ` (${tool.reviewCount.toLocaleString()})`}
                                        </span>
                                    </div>
                                )}
                                {tool.pricing && (
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[9px] font-medium border",
                                        pricingColors[tool.pricing]
                                    )}>
                                        {tool.pricing}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                    {tool.commonScenario}
                </p>

                <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                        {tool.bestForStage.map((stage) => (
                            <span
                                key={stage}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border",
                                    stageBadgeColors[stage]
                                )}
                            >
                                {stageIcons[stage]}
                                {stage}
                            </span>
                        ))}
                    </div>

                    <button
                        onClick={() => onDetailsClick(tool)}
                        className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        More details
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

function CategorySection({ category, onToolClick }: { category: Category; onToolClick: (t: Tool) => void }) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    {category.name}
                </h2>
                <p className="text-muted-foreground text-sm max-w-3xl">
                    {category.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} onDetailsClick={onToolClick} />
                ))}
            </div>
        </div>
    );
}

export default function PMToolsPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>(pmToolsData[0].id);
    const [stageFilter, setStageFilter] = useState<CompanyStage | 'All'>('All');
    const [sortBy, setSortBy] = useState<'default' | 'rating' | 'name'>('default');
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

    const currentCategory = pmToolsData.find(cat => cat.id === selectedCategory) || pmToolsData[0];

    let filteredTools = stageFilter === 'All'
        ? currentCategory.tools
        : currentCategory.tools.filter(tool =>
            tool.bestForStage.includes(stageFilter) || tool.bestForStage.includes('All')
        );

    // Sort tools
    if (sortBy === 'rating') {
        filteredTools = [...filteredTools].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name') {
        filteredTools = [...filteredTools].sort((a, b) => a.name.localeCompare(b.name));
    }

    const filteredCategory = { ...currentCategory, tools: filteredTools };

    // Calculate average rating for category
    const avgRating = filteredTools.length > 0 && filteredTools.some(t => t.rating)
        ? (filteredTools.reduce((sum, tool) => sum + (tool.rating || 0), 0) / filteredTools.filter(t => t.rating).length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">PM Tool Atlas</h1>
                <p className="text-muted-foreground text-lg">
                    A curated directory of tools for Product Managers, organized by workflow and use case.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 pb-4 border-b">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">Stage:</span>
                            <div className="flex gap-1">
                                {(['All', 'Startup', 'Scaleup', 'Enterprise'] as const).map((stage) => (
                                    <button
                                        key={stage}
                                        onClick={() => setStageFilter(stage)}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
                                            stageFilter === stage
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-muted-foreground hover:bg-accent border-border"
                                        )}
                                    >
                                        {stage}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">Sort:</span>
                            <div className="flex gap-1">
                                {[
                                    { value: 'default', label: 'Default' },
                                    { value: 'rating', label: 'Rating' },
                                    { value: 'name', label: 'Name' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSortBy(option.value as any)}
                                        className={cn(
                                            "px-3 py-1 rounded-md text-xs font-medium transition-colors border",
                                            sortBy === option.value
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-muted-foreground hover:bg-accent border-border"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}</span>
                        {filteredTools.some(t => t.rating) && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {avgRating} avg
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="border-b overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {pmToolsData.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                                "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                                selectedCategory === category.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Content */}
            <CategorySection category={filteredCategory} onToolClick={setSelectedTool} />

            {/* Footer Note */}
            <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> This is a curated selection of widely-adopted PM tools.
                    The "best for stage" recommendations are guidelines based on typical usage patterns.
                    Your specific needs may vary based on team size, budget, and workflow preferences.
                </p>
            </div>

            {/* Details Modal */}
            {selectedTool && (
                <ToolDetailsModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
            )}
        </div>
    );
}
