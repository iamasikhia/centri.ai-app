'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { fundingOpportunities, OpportunityType, OpportunityStage, FundingOpportunity } from '@/data/funding-opportunities';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Filter, ExternalLink, ArrowRight, MapPin, Calendar, DollarSign, Search, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { OrganizationLogo } from '@/components/organization-logo';
import { AddOpportunityModal } from '@/components/add-opportunity-modal';
import { Button } from '@/components/ui/button';

// --- Inline Components ---

// Badge component fallback if not in UI kit
function SimpleBadge({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'secondary' }) {
    const styles = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline: 'text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    };
    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", styles[variant])}>
            {children}
        </span>
    );
}

export default function FundraisingPage() {
    const [typeFilter, setTypeFilter] = useState<OpportunityType | 'All'>('All');
    const [stageFilter, setStageFilter] = useState<OpportunityStage | 'All'>('All');
    const [isSearching, setIsSearching] = useState(false);
    const [deepSearchResults, setDeepSearchResults] = useState<FundingOpportunity[]>([]);

    // User Submission State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userAddedOpps, setUserAddedOpps] = useState<FundingOpportunity[]>([]);
    const [savedOpps, setSavedOpps] = useState<FundingOpportunity[]>([]);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/fundraising`, {
                    headers: { 'x-user-id': 'default-user-id' }
                });
                // Map response if necessary, assuming 1:1 for now or partial helper
                setSavedOpps(res.data);
            } catch (e) {
                console.error("Failed to fetch opportunities", e);
            }
        }
        fetchSaved();
    }, []);

    const handleAddOpportunity = (newOpp: FundingOpportunity) => {
        setUserAddedOpps(prev => [newOpp, ...prev]);
    };

    const handleDeepSearch = async () => {
        setIsSearching(true);
        // Simulate web scanning
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Mock "Found" items
        const newItems: FundingOpportunity[] = [
            {
                id: 'deep-search-1',
                name: 'Falcon Foundation',
                type: 'Grant',
                amount: '$5M Grant Pool',
                description: 'Open source AI grants for the Middle East and Global South.',
                fullDescription: 'Discovered via Deep Search. Focused on democratizing AI access.',
                whatItOffers: ['Equity-free grants', 'Compute resources'],
                criteria: ['Open Source', 'AI'],
                stage: ['Seed', 'Growth'],
                location: 'Abu Dhabi / Global',
                deadline: 'Rolling',
                website: 'https://www.tii.ae',
                tags: ['AI', 'Middle East', 'Grant'],
                aiInsight: 'Found this emerging opportunity in the Middle East region matching your AI keywords.'
            },
            {
                id: 'deep-search-2',
                name: 'Station F',
                type: 'Startup Program',
                amount: 'Incubation',
                description: 'World\'s largest startup campus in Paris.',
                fullDescription: 'Discovered via Deep Search from European tech news.',
                whatItOffers: ['Office space', 'VC access', 'Perks'],
                criteria: ['Based in Paris', 'Scalable'],
                stage: ['Pre-Seed', 'Seed'],
                location: 'Paris, France',
                deadline: '2026-06-01T00:00:00Z',
                website: 'https://stationf.co',
                tags: ['Europe', 'Campus'],
                aiInsight: 'The central hub for the European ecosystem. Great for networking.'
            },
            {
                id: 'deep-search-3',
                name: '100X.VC',
                type: 'Venture Capital',
                amount: '$150k (₹1.25 Cr)',
                description: 'First cheque VC for India.',
                fullDescription: 'Discovered via Deep Search. India\'s first fund to invest in early stage startups using iSAFE.',
                whatItOffers: ['First cheque', 'Masterclass', 'Pitch day'],
                criteria: ['India-based or Indian founders', 'Scalable'],
                stage: ['Seed'],
                location: 'Mumbai, India',
                deadline: 'Rolling',
                website: 'https://www.100x.vc',
                tags: ['India', 'VC', 'Seed'],
                aiInsight: 'Top choice for Indian founders looking for speed of execution.'
            }
        ];

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/fundraising/save-deep-search`,
                { opportunities: newItems },
                { headers: { 'x-user-id': 'default-user-id' } }
            );
            // persistence successful: add to saved state so they stick around
            if (res.data) {
                setSavedOpps(prev => [...prev, ...res.data]);
            }
        } catch (e) {
            console.error("Failed to save deep search results", e);
            // Fallback: Show as temporary session results if save fails
            setDeepSearchResults(newItems);
        }

        setIsSearching(false);
    };

    // Filter Logic: User items first, then Saved, then Deep Search (session), then Standard
    const allOpportunities = [...userAddedOpps, ...savedOpps, ...deepSearchResults, ...fundingOpportunities];
    const filteredWrapper = allOpportunities.filter(opp => {
        const typeMatch = typeFilter === 'All' || opp.type === typeFilter;
        const stageMatch = stageFilter === 'All' || opp.stage.includes(stageFilter);
        return typeMatch && stageMatch;
    });

    const activeCount = filteredWrapper.length;

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto p-6 md:p-8 pb-20 relative">

            <AddOpportunityModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddOpportunity}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Fundraising & Opportunities</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Discover grants, accelerators, and startup programs to fuel your product's growth.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Opportunity
                    </Button>
                    <button
                        onClick={handleDeepSearch}
                        disabled={isSearching}
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 h-10"
                    >
                        {isSearching ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Scanning Web...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Deep Search
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* AI Insight Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-background rounded-lg shadow-sm border text-emerald-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                            AI Opportunity Scout
                        </h3>
                        <p className="text-lg font-medium leading-relaxed text-foreground/90">
                            3 funding opportunities this month are particularly suitable for early-stage product teams.
                            <span className="text-muted-foreground font-normal ml-2">Consider applying to Y Combinator this week.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground mr-2" />

                    {/* Type Filter */}
                    <select
                        className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus:ring-1 focus:ring-ring"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                    >
                        <option value="All">All Types</option>
                        <option value="Grant">Grant</option>
                        <option value="Accelerator">Accelerator</option>
                        <option value="Fellowship">Fellowship</option>
                        <option value="Startup Program">Startup Program</option>
                    </select>

                    {/* Stage Filter */}
                    <select
                        className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus:ring-1 focus:ring-ring"
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value as any)}
                    >
                        <option value="All">All Stages</option>
                        <option value="Idea">Idea</option>
                        <option value="MVP">MVP</option>
                        <option value="Pre-Seed">Pre-Seed</option>
                        <option value="Seed">Seed</option>
                        <option value="Growth">Growth</option>
                    </select>
                </div>

                <div className="text-sm text-muted-foreground font-medium">
                    Showing {activeCount} opportunities
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWrapper.map(opp => (
                    <Card key={opp.id} className="flex flex-col h-full hover:shadow-lg transition-all hover:border-primary/50 group">
                        <CardContent className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <SimpleBadge variant="secondary">{opp.type}</SimpleBadge>
                                {opp.deadline !== 'Rolling' && (
                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        Open
                                    </span>
                                )}
                            </div>

                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 shrink-0">
                                    <OrganizationLogo name={opp.name} website={opp.website} className="w-full h-full" />
                                </div>
                                <div>
                                    <div className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{opp.name}</div>
                                    <div className="text-xl font-bold text-foreground">{opp.amount}</div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{opp.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4 shrink-0" />
                                    <span>
                                        {opp.deadline.toLowerCase().includes('rolling')
                                            ? (opp.deadline === 'Rolling' ? 'Rolling Deadline' : opp.deadline)
                                            : `Apply by ${format(new Date(opp.deadline), 'MMM d')}`}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t">
                                <Link
                                    href={`/fundraising/${opp.id}`}
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
                                >
                                    Details
                                </Link>
                                <a
                                    href={opp.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                                >
                                    Visit <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
