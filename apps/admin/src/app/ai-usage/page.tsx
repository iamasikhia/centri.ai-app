import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Bot, FileText, ListTodo, BrainCircuit } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AIUsagePage() {
  const processedMeetings = await prisma.meeting.findMany({
    where: {
      OR: [
        { summary: { not: null } },
        { transcript: { not: null } },
        { actionItemsJson: { not: null } }
      ]
    },
    orderBy: { createdAt: 'desc' },
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
        <h1 className="text-3xl font-bold tracking-tight">AI Usage</h1>
        <p className="text-muted-foreground">Monitor AI processing and generation activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Meetings</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedMeetings.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>AI Processing History</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Meeting Title</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Features Generated</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Processed</th>
                </tr>
              </thead>
              <tbody>
                {processedMeetings.map((meeting) => (
                  <tr key={meeting.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{meeting.title}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{meeting.user.name}</span>
                        <span className="text-xs text-muted-foreground">{meeting.user.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2">
                        {meeting.summary && <Badge variant="secondary" className="text-xs"><FileText className="w-3 h-3 mr-1" /> Summary</Badge>}
                        {meeting.actionItemsJson && <Badge variant="secondary" className="text-xs"><ListTodo className="w-3 h-3 mr-1" /> Actions</Badge>}
                        {meeting.transcript && <Badge variant="secondary" className="text-xs">Transcript</Badge>}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                        Processed
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{formatRelativeTime(meeting.createdAt)}</td>
                  </tr>
                ))}
                {processedMeetings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No AI usage recorded yet.
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
