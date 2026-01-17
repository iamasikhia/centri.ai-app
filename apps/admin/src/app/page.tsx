import {
  Activity,
  BarChart3,
  Globe,
  HardDrive,
  Shield,
  Zap,
  Server,
  Users
} from 'lucide-react';
import { MetricZone } from '@/components/dashboard/metric-zone';
import { DataCard } from '@/components/dashboard/data-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  getGlobalKPIs,
  getFeatureUsage,
  getIntegrationHealth,
  getAIIntelligence,
  getSystemReliability
} from '@/lib/analytics';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserGrowthChart } from '@/components/charts/user-growth-chart';
import { formatNumber } from '@/lib/utils';
import { RefreshButton } from '@/components/dashboard/refresh-button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MasterControlPage() {
  const [
    kpis,
    features,
    integrations,
    ai,
    reliability
  ] = await Promise.all([
    getGlobalKPIs(),
    getFeatureUsage(),
    getIntegrationHealth(),
    getAIIntelligence(),
    getSystemReliability()
  ]);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto pb-20">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mission Control</h1>
            <p className="text-muted-foreground">Global system overview</p>
          </div>
          <div className="flex items-center gap-3">
            <RefreshButton />
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-muted-foreground uppercase">System Status</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-sm">Operational</span>
              </div>
            </div>
          </div>
        </div>
        <Separator className="mt-4" />
      </div>

      {/* 1. GLOBAL KPIs */}
      <MetricZone title="Global KPIs" icon={Globe} description="Core business health and growth velocity">
        <DataCard
          title="Total Users"
          value={kpis.totalUsers}
          trend={kpis.growthRates.users}
          intent="good"
        />
        <DataCard
          title="Daily Active Users"
          value={kpis.dau}
          subValue={`(${((kpis.dau / kpis.totalUsers) * 100).toFixed(1)}%)`}
          trend={kpis.growthRates.dau}
          intent="good"
        />
        <DataCard
          title="Monthly Active Users"
          value={kpis.mau}
        />
        <DataCard
          title="Activation Rate"
          value={`${kpis.activationRate.toFixed(1)}%`}
          intent="good"
        />
        <DataCard
          title="Active Organizations"
          value={kpis.activeOrgs}
        />
        <DataCard
          title="Churn Rate (Est.)"
          value={`${kpis.churnRate}%`}
          intent="bad"
          trend={-0.1}
        />
        <DataCard
          title="WAU"
          value={kpis.wau}
        />
        <DataCard
          title="New Signups Today"
          value={kpis.newSignups}
          intent="good"
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
        <div className="col-span-full border rounded-lg p-6 bg-card">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Pipeline Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(reliability.pipelineStatus).map(([name, status]) => {
              const labelMap: Record<string, string> = {
                ai: 'AI',
                github: 'GitHub',
                api: 'API',
                slack: 'Slack',
                calendar: 'Calendar',
                notifications: 'Notifications'
              };
              return (
                <div key={name} className="flex flex-col gap-2">
                  <span className="text-sm font-medium">{labelMap[name] || name}</span>
                  <StatusBadge status={status as any} />
                </div>
              );
            })}
          </div>
        </div>
      </MetricZone>

      {/* 6. SECURITY & COMPLIANCE */}
      <MetricZone title="Security & Compliance" icon={Shield}>
        <Card className="col-span-full">
          <CardHeader><CardTitle className="text-sm">Audit Log Stream</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {[
                { action: 'Admin Login', user: 'iseoluwa@centri.ai', ip: '192.168.1.1', time: 'Just now' },
                { action: 'Permission Change', user: 'System', details: 'Updated Role: Admin', time: '2m ago' },
                { action: 'Token Access', user: 'API Client', details: 'Read: Users', time: '5m ago' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div className="flex gap-4">
                    <span className="font-mono text-xs text-muted-foreground w-20">{log.time}</span>
                    <span className="font-medium text-foreground">{log.action}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {log.user}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </MetricZone>
    </div>
  );
}
