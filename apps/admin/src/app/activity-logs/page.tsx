import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollText, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ActivityLogsPage() {
  const logs = await prisma.updateItem.findMany({
    orderBy: { occurredAt: 'desc' },
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
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">Real-time activity stream from all users</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Activity Stream ({logs.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Details</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Severity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{formatRelativeTime(log.occurredAt)}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user.name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="capitalize">
                        {log.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{log.title}</div>
                      {log.body && <div className="text-xs text-muted-foreground truncate max-w-[300px]">{log.body}</div>}
                    </td>
                    <td className="p-4 align-middle">
                      {log.severity === 'urgent' && <Badge variant="destructive">Urgent</Badge>}
                      {log.severity === 'important' && <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Important</Badge>}
                      {log.severity === 'info' && <Badge variant="secondary">Info</Badge>}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ScrollText className="h-8 w-8 opacity-50" />
                        <p>No activity logs found</p>
                      </div>
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
