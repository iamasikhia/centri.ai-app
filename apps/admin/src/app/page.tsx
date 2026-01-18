import {
  Activity,
  BarChart3,
  Globe,
  Shield,
  Zap,
  Server,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';
import { MetricZone } from '@/components/dashboard/metric-zone';
import { DataCard } from '@/components/dashboard/data-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  getGlobalKPIs,
  getFeatureUsage,
  getIntegrationHealth,
  getAIIntelligence,
  getSystemReliability,
  getRevenueMetrics
} from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MasterControlPage() {
  const [
    kpis,
    features,
    integrations,
    ai,
    reliability,
    revenue
  ] = await Promise.all([
    getGlobalKPIs(),
    getFeatureUsage(),
    getIntegrationHealth(),
    getAIIntelligence(),
    getSystemReliability(),
    getRevenueMetrics()
  ]);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto pb-20">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-background p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Mission Control
            </h1>
            <p className="text-muted-foreground text-lg">Global system overview and revenue metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshButton />
            <div className="flex flex-col items-end px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">System Status</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REVENUE SUMMARY - Compact Overview */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Revenue Overview
                {revenue.subscriptionGrowthRate > 0 && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/10">
                    +{revenue.subscriptionGrowthRate.toFixed(1)}% growth
                  </span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Key financial metrics at a glance</p>
            </div>
          </div>
          <Link 
            href="/revenue" 
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            View Detailed Revenue →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <DataCard
            title="MRR"
            value={`$${revenue.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            intent="good"
          />
          <DataCard
            title="ARR"
            value={`$${revenue.arr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            intent="good"
          />
          <DataCard
            title="Paying Users"
            value={revenue.payingUsers}
            subValue={`${revenue.totalUsers > 0 ? ((revenue.payingUsers / revenue.totalUsers) * 100).toFixed(1) : '0'}% of ${revenue.totalUsers} total`}
            intent="good"
          />
          <DataCard
            title="ARPU"
            value={`$${revenue.arpu.toFixed(2)}`}
            intent="good"
          />
        </div>
      </div>

      {/* 1. GLOBAL KPIs */}
      <MetricZone title="Global KPIs" icon={Globe} description="Core business health and growth velocity">
        <DataCard
          title="Total Users"
          value={revenue.totalUsers}
          subValue={`${revenue.payingUsers} paying • ${revenue.freeUsers} free`}
          intent="good"
        />
        <DataCard
          title="Activation Rate"
          value={`${kpis.activationRate.toFixed(1)}%`}
          intent="good"
        />
        <DataCard
          title="New Signups (This Month)"
          value={kpis.newSignups}
          intent="good"
        />
        <DataCard
          title="Active Organizations"
          value={kpis.activeOrgs}
        />
        <Card className="relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border bg-gradient-to-br from-primary/5 via-primary/2 to-transparent">
          <CardContent className="p-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Activity</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  DAU: {kpis.dau} | WAU: {kpis.wau} | MAU: {kpis.mau}
                </span>
              </div>
              <Link 
                href="/user-insights" 
                className="text-xs text-primary hover:underline font-medium inline-block"
              >
                View detailed activity insights →
              </Link>
            </div>
          </CardContent>
        </Card>
        <DataCard
          title="Churn Rate"
          value={`${revenue.churnedUsers > 0 && revenue.payingUsers > 0 ? ((revenue.churnedUsers / revenue.payingUsers) * 100).toFixed(1) : '0'}%`}
          intent="bad"
        />
      </MetricZone>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 2. USAGE INTELLIGENCE */}
        <MetricZone title="Usage Intelligence" icon={BarChart3} className="h-full">
          <DataCard title="Meetings Processed" value={features.meetingsProcessed} />
          <DataCard title="Dashboards Viewed" value={features.dashboardViews} />
          <DataCard title="Chat Conversations" value={features.chatConversations} />
          <DataCard title="AI Interactions" value={features.aiInteractions} />
          <DataCard title="Tasks Created" value={features.tasksCreated} />
          <DataCard title="Stakeholders Tracked" value={features.stakeholdersTracked} />
        </MetricZone>

        {/* 3. INTEGRATIONS HEALTH */}
        <MetricZone title="Integrations Health" icon={Activity} className="h-full">
          <DataCard
            title="Total Connections"
            value={integrations.totalConnections}
          />
          <DataCard
            title="Sync Success Rate"
            value={`${integrations.syncSuccessRate.toFixed(1)}%`}
            intent="good"
          />
          <DataCard
            title="Failed Syncs (24h)"
            value={integrations.failedSyncs24h}
            intent="bad"
          />
          <DataCard
            title="Google Connections"
            value={integrations.breakdown['google'] || 0}
          />
          <DataCard
            title="Slack Connections"
            value={integrations.breakdown['slack'] || 0}
          />
        </MetricZone>
      </div>

      {/* 4. AI & COST CONTROL */}
      <MetricZone title="AI Intelligence & Cost" icon={Zap}>
        <DataCard
          title="Total AI Requests"
          value={ai.totalRequests}
        />
        <DataCard
          title="Est. Tokens Used"
          value={formatNumber(ai.totalTokens)}
        />
        <DataCard
          title="Est. Cost (Total)"
          value={`$${ai.estimatedCost.toFixed(2)}`}
        />
        <DataCard
          title="Cost / User"
          value={`$${ai.costPerUser.toFixed(4)}`}
        />
      </MetricZone>

      {/* 5. PLATFORM RELIABILITY */}
      <MetricZone title="Platform Reliability (Engineering)" icon={Server}>
        <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <span className="text-sm font-medium">API Uptime</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-600/90">{reliability.apiUptime}%</span>
              <StatusBadge status={reliability.apiUptime > 99 ? 'healthy' : 'degraded'} label={reliability.apiUptime > 99 ? 'OK' : 'Degraded'} />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <span className="text-sm font-medium">Avg Latency</span>
            <span className="font-mono font-bold">{reliability.apiLatency}ms</span>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <span className="text-sm font-medium">Error Rate</span>
            <span className="font-mono font-bold text-emerald-600/90">{reliability.errorRate}%</span>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <span className="text-sm font-medium">Job Failures</span>
            <span className="font-mono font-bold">{reliability.jobFailures}</span>
          </div>
        </div>
      </MetricZone>

      {/* 6. SECURITY & COMPLIANCE */}
      <MetricZone title="Security & Compliance" icon={Shield}>
        <Card className="col-span-full">
          <CardHeader><CardTitle className="text-sm">Audit Log Stream</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground text-center py-8">
                Audit logging will be implemented in a future update. No audit logs available yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </MetricZone>
    </div>
  );
}
