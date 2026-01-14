import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SystemHealthPage() {
  const syncRuns = await prisma.syncRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground">Monitor system performance and sync jobs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncRuns.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sync History</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Provider</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Started</th>
                </tr>
              </thead>
              <tbody>
                {syncRuns.map((run) => (
                  <tr key={run.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      {run.status === 'success' && <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>}
                      {run.status === 'failed' && <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>}
                      {run.status === 'running' && <Badge variant="secondary"><Activity className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>}
                    </td>
                    <td className="p-4 align-middle capitalize">{run.provider}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{run.user.name}</span>
                        <span className="text-xs text-muted-foreground">{run.user.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {run.finishedAt ? (() => {
                        const duration = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
                        return `${(duration / 1000).toFixed(1)}s`;
                      })() : '-'}
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{formatRelativeTime(run.startedAt)}</td>
                  </tr>
                ))}
                {syncRuns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No sync runs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
