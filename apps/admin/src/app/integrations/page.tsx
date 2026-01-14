import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Settings2, Globe, Slack, Github, Mail, FileText, Video } from 'lucide-react';
import { IntegrationToggle } from './integration-toggle';

export const dynamic = 'force-dynamic';

const PROVIDERS = [
  { key: 'google', name: 'Google Calendar', icon: Globe },
  { key: 'slack', name: 'Slack', icon: Slack },
  { key: 'github', name: 'GitHub', icon: Github },
  { key: 'zoom', name: 'Zoom', icon: Video },
  { key: 'fathom', name: 'Fathom', icon: Video },
  { key: 'gmail', name: 'Gmail', icon: Mail },
  { key: 'notion', name: 'Notion', icon: FileText },
  { key: 'drive', name: 'Google Drive/Docs', icon: FileText },
];

export default async function IntegrationsPage() {
  const [integrations, settings] = await Promise.all([
    prisma.integrations.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }),
    prisma.systemSetting.findUnique({
      where: { key: 'integration_config' }
    })
  ]);

  const config = (settings?.value as Record<string, boolean>) || {};

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Manage and monitor platform integrations</p>
        </div>
        <div className="flex gap-4">
          <Card className="w-[200px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrations.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Availability Control</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PROVIDERS.map((provider) => (
            <Card key={provider.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{provider.name}</CardTitle>
                <provider.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {config[provider.key] === false ? 'Disabled' : 'Enabled'}
                  </span>
                  <IntegrationToggle
                    integrationKey={provider.key}
                    defaultEnabled={config[provider.key] ?? true}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
