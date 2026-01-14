
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, X, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Fetch meetings and user info.',
    domain: 'calendar.google.com',
    logoUrl: 'https://fonts.gstatic.com/s/i/productlogos/calendar_2020q4/v13/web-64dp/logo_calendar_2020q4_color_2x_web_64dp.png'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Fetch recent emails as updates.',
    domain: 'gmail.com',
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/gmail-icon.svg'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Discover team members.',
    domain: 'slack.com',
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg'
  },

  {
    id: 'github',
    name: 'GitHub',
    description: 'Track merged PRs to main/product.',
    domain: 'github.com',
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/github-icon-1.svg'
  },

  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Search and organize files.',
    domain: 'drive.google.com',
    logoUrl: 'https://fonts.gstatic.com/s/i/productlogos/drive_2020q4/v8/web-64dp/logo_drive_2020q4_color_2x_web_64dp.png'
  },
  {
    id: 'google_docs',
    name: 'Google Docs',
    description: 'Create and edit documents.',
    domain: 'docs.google.com',
    logoUrl: 'https://fonts.gstatic.com/s/i/productlogos/docs_2020q4/v6/web-64dp/logo_docs_2020q4_color_2x_web_64dp.png'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace.',
    domain: 'notion.so',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing.',
    domain: 'zoom.us',
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/zoom-communications-logo.svg'
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    description: 'Video conferencing.',
    domain: 'meet.google.com',
    logoUrl: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v1/web-64dp/logo_meet_2020q4_color_2x_web_64dp.png'
  },

  {
    id: 'fathom',
    name: 'Fathom',
    description: 'AI Meeting Recorder.',
    domain: 'fathom.video',
    logoUrl: 'https://fathom.video/apple-touch-icon.png'
  }
];

import { useSession } from 'next-auth/react';

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const userId = 'default-user-id'; // Temporarily use default ID to match existing integrations

  const fetchData = async () => {
    if (status === 'loading') return;
    setLoading(true);
    try {
      const [statusRes, configRes] = await Promise.all([
        fetch('http://localhost:3001/integrations/status', {
          headers: { 'x-user-id': userId }
        }),
        fetch('http://localhost:3001/integrations/config')
      ]);

      if (statusRes.ok) {
        const json = await statusRes.json();
        setConnections(json);
      }
      if (configRes.ok) {
        const json = await configRes.json();
        setConfig(json);
      }
    } catch (e) {
      console.warn("Failed to fetch integration data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchData();
    }

    // Refresh status when user returns to the page (after OAuth)
    const handleFocus = () => {
      if (status !== 'loading') fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, userId]);

  const handleConnect = async (provider: string) => {
    // ... existing handleConnect logic ...
    const stubs: string[] = [];
    if (stubs.includes(provider)) {
      const name = PROVIDERS.find(p => p.id === provider)?.name || provider;
      alert(`${name} stub implemented. Assume connected for demo.`);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/integrations/${provider}/connect`, {
        method: 'POST',
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Connection failed');
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      console.error("Connection failed", e);
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await fetch(`http://localhost:3001/integrations/${provider}/disconnect`, {
        method: 'POST',
        headers: { 'x-user-id': userId }
      });
      fetchData();
    } catch (e) {
      console.error("Disconnect failed", e);
    }
  };

  if (loading) {
    // ... exisiting skeleton ...
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        {/* ... */}
      </div>
    );
  }

  // Filter Providers
  const visibleProviders = PROVIDERS.filter(p => config[p.id] !== false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">Manage your connections to external tools.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visibleProviders.map(p => {
          const isConnected = connections.find(c => c.provider === p.id);
          // @ts-ignore
          const logoUrl = p.logoUrl || `https://logo.clearbit.com/${p.domain}`;

          return (
            <Card key={p.id} className="h-full hover:shadow-md transition-shadow">
              {/* ... Card content ... */}
              <div className="flex flex-col items-center text-center p-6 h-full gap-4">
                {/* Logo */}
                <div className="w-16 h-16 rounded-xl bg-white border p-3 flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src={logoUrl}
                    alt={`${p.name} logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to Google Favicon
                      (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${p.domain}&sz=64`;
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-1 min-h-[80px]">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3">{p.description}</p>
                </div>

                {/* Action */}
                <div className="w-full pt-2 mt-auto">
                  {isConnected ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleDisconnect(p.id)}
                        className="w-full py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                      >
                        Disconnect
                      </button>
                      <span className="flex items-center justify-center gap-1.5 text-green-600 text-[10px] font-medium uppercase tracking-wider">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(p.id)}
                      className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      Connect <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
