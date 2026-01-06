
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fundingOpportunities } from '@/data/funding-opportunities';
import { ArrowLeft, ExternalLink, Calendar, MapPin, DollarSign, PieChart, CheckCircle2, Sparkles, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationLogo } from '@/components/organization-logo';

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
    const opportunity = fundingOpportunities.find(o => o.id === params.id);

    if (!opportunity) {
        return notFound();
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 pb-20">
            {/* Back Nav */}
            <Link
                href="/fundraising"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Opportunities
            </Link>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between border-b pb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <OrganizationLogo
                            name={opportunity.name}
                            website={opportunity.website}
                            className="w-16 h-16 rounded-xl p-3 shrink-0 shadow-sm"
                        />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{opportunity.name}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                                    "bg-secondary text-secondary-foreground"
                                )}>
                                    {opportunity.type}
                                </span>
                                <span className="text-muted-foreground text-sm flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {opportunity.location}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px]">
                    <a
                        href={opportunity.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-all"
                    >
                        Visit Website <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Main Content (2 cols) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Why This Matters (AI Insight) */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-1" />
                            <div>
                                <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-300 mb-2">Why this matters for you</h3>
                                <p className="text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed text-lg">
                                    {opportunity.aiInsight}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Overview */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            Program Overview
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {opportunity.fullDescription}
                        </p>
                    </section>

                    {/* What it Offers */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-muted-foreground" />
                            What {opportunity.name} Offers
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {opportunity.whatItOffers.map((offer, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                    <span className="font-medium text-sm">{offer}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Key Details Sidebar (1 col) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Key Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Funding */}
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Funding Amount</div>
                                <div className="text-2xl font-bold tracking-tight text-foreground">{opportunity.amount}</div>
                            </div>

                            {/* Equity */}
                            <div className="flex items-start gap-3 pb-4 border-b">
                                <PieChart className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium text-foreground">Equity Required</div>
                                    <div className="text-sm text-muted-foreground">{opportunity.equity || 'None / Not specified'}</div>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-start gap-3 pb-4 border-b">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <div className="text-sm font-medium text-foreground">Application Deadline</div>
                                    <div className="text-sm text-muted-foreground font-medium text-emerald-600">
                                        {opportunity.deadline.toLowerCase().includes('rolling')
                                            ? (opportunity.deadline === 'Rolling' ? 'Rolling Basis' : opportunity.deadline)
                                            : format(new Date(opportunity.deadline), 'MMMM d, yyyy')}
                                    </div>
                                </div>
                            </div>

                            {/* Stage */}
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Target Stage</div>
                                <div className="flex flex-wrap gap-2">
                                    {opportunity.stage.map(s => (
                                        <span key={s} className="px-2 py-1 bg-muted rounded-md text-xs font-medium border">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Eligibility Card */}
                    <Card className="bg-slate-50 dark:bg-slate-900/50">
                        <CardHeader>
                            <CardTitle className="text-base">Eligibility</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {opportunity.criteria.map((c, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="select-none text-primary/60">•</span>
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
