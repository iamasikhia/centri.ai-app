
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, X, ExternalLink, Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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

// Suggested integrations organized by category (not yet implemented)
const SUGGESTED_INTEGRATIONS = {
  'Project Management': [
    { id: 'jira', name: 'Jira', logo: 'https://cdn.simpleicons.org/jira/0052CC' },
    { id: 'asana', name: 'Asana', logo: 'https://cdn.simpleicons.org/asana/F06A6A' },
    { id: 'trello', name: 'Trello', logo: 'https://cdn.simpleicons.org/trello/0052CC' },
    { id: 'monday', name: 'Monday.com', logo: 'https://cdn.worldvectorlogo.com/logos/monday-1.svg' },
    { id: 'linear', name: 'Linear', logo: 'https://cdn.simpleicons.org/linear/5E6AD2' },
    { id: 'clickup', name: 'ClickUp', logo: 'https://cdn.simpleicons.org/clickup/7B68EE' },
  ],
  'Communication': [
    { id: 'microsoft_teams', name: 'Microsoft Teams', logo: 'https://img.icons8.com/color/96/microsoft-teams.png' },
    { id: 'discord', name: 'Discord', logo: 'https://cdn.simpleicons.org/discord/5865F2' },
    { id: 'intercom', name: 'Intercom', logo: 'https://cdn.simpleicons.org/intercom/6AFDEF' },
    { id: 'loom', name: 'Loom', logo: 'https://cdn.simpleicons.org/loom/625DF5' },
  ],
  'Development': [
    { id: 'gitlab', name: 'GitLab', logo: 'https://cdn.simpleicons.org/gitlab/FC6D26' },
    { id: 'bitbucket', name: 'Bitbucket', logo: 'https://cdn.simpleicons.org/bitbucket/0052CC' },
    { id: 'azure_devops', name: 'Azure DevOps', logo: 'https://img.icons8.com/color/96/azure-devops.png' },
    { id: 'datadog', name: 'Datadog', logo: 'https://cdn.simpleicons.org/datadog/632CA6' },
    { id: 'sentry', name: 'Sentry', logo: 'https://cdn.simpleicons.org/sentry/362D59' },
    { id: 'pagerduty', name: 'PagerDuty', logo: 'https://cdn.simpleicons.org/pagerduty/06AC38' },
  ],
  'Documentation': [
    { id: 'confluence', name: 'Confluence', logo: 'https://cdn.simpleicons.org/confluence/172B4D' },
    { id: 'coda', name: 'Coda', logo: 'https://cdn.simpleicons.org/coda/F46A54' },
    { id: 'dropbox', name: 'Dropbox', logo: 'https://cdn.simpleicons.org/dropbox/0061FF' },
  ],
  'CRM & Sales': [
    { id: 'salesforce', name: 'Salesforce', logo: 'https://cdn.simpleicons.org/salesforce/00A1E0' },
    { id: 'hubspot', name: 'HubSpot', logo: 'https://cdn.simpleicons.org/hubspot/FF7A59' },
    { id: 'pipedrive', name: 'Pipedrive', logo: 'https://www.pipedrive.com/favicon.ico' },
  ],
  'Analytics': [
    { id: 'amplitude', name: 'Amplitude', logo: 'https://amplitude.com/favicon.ico' },
    { id: 'mixpanel', name: 'Mixpanel', logo: 'https://cdn.simpleicons.org/mixpanel/7856FF' },
    { id: 'google_analytics', name: 'Google Analytics', logo: 'https://cdn.simpleicons.org/googleanalytics/E37400' },
    { id: 'posthog', name: 'PostHog', logo: 'https://cdn.simpleicons.org/posthog/F9BD2B' },
  ],
};

import { useSession } from 'next-auth/react';

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const userId = 'default-user-id'; // Temporarily use default ID to match existing integrations

  const fetchData = async (forceRefresh = false) => {
    if (status === 'loading') return;

    const cacheKey = 'integrations_cache';
    const cacheTimeKey = 'integrations_cache_time';
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    // Try cache first
    if (!forceRefresh && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheTimeKey);

      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < CACHE_DURATION) {
          const { connections: cachedConn, config: cachedConfig } = JSON.parse(cached);
          setConnections(cachedConn || []);
          setConfig(cachedConfig || {});
          setLoading(false);
          return; // Use cache, skip network
        }
      }
    }

    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const [statusRes, configRes] = await Promise.all([
        fetch(`${API_URL}/integrations/status`, {
          headers: { 'x-user-id': userId }
        }),
        fetch(`${API_URL}/integrations/config`)
      ]);

      let newConnections: any[] = [];
      let newConfig: Record<string, boolean> = {};

      if (statusRes.ok) {
        newConnections = await statusRes.json();
        setConnections(newConnections);
      }
      if (configRes.ok) {
        newConfig = await configRes.json();
        setConfig(newConfig);
      }

      // Cache the result
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify({ connections: newConnections, config: newConfig }));
        sessionStorage.setItem(cacheTimeKey, Date.now().toString());
      }
    } catch (e) {
      console.warn("Failed to fetch integration data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchData(true);
    }

    // Refresh status when user returns to the page (after OAuth)
    const handleFocus = () => {
      if (status !== 'loading') fetchData(true);
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${API_URL}/integrations/${provider}/connect`, {
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      await fetch(`${API_URL}/integrations/${provider}/disconnect`, {
        method: 'POST',
        headers: { 'x-user-id': userId }
      });
      fetchData(true);
    } catch (e) {
      console.error("Disconnect failed", e);
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmitRequest = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      await fetch(`${API_URL}/integration-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ integrationIds: selectedPlatforms }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setSubmitted(false);
        setSelectedPlatforms([]);
      }, 2000);
    } catch (e) {
      console.error('Failed to submit integration request:', e);
      // Fallback to localStorage
      localStorage.setItem('requested_integrations', JSON.stringify(selectedPlatforms));
      setSubmitted(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setSubmitted(false);
        setSelectedPlatforms([]);
      }, 2000);
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

        {/* Request Integration Card */}
        <Card
          className="h-full border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer group"
          onClick={() => setShowRequestModal(true)}
        >
          <div className="flex flex-col items-center justify-center text-center p-6 h-full gap-4 min-h-[280px]">
            <div className="w-16 h-16 rounded-xl bg-muted border-2 border-dashed flex items-center justify-center shrink-0 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 flex flex-col gap-1 items-center justify-center">
              <h3 className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Integration not here?</h3>
              <p className="text-xs text-muted-foreground">Request new integrations</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowRequestModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Request Integrations</h2>
                <p className="text-muted-foreground mt-1">Select the platforms you'd like to see on Centri. We'll prioritize based on demand.</p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Thank you!</h3>
                    <p className="text-muted-foreground text-center">We've received your request for {selectedPlatforms.length} integration{selectedPlatforms.length !== 1 ? 's' : ''}.</p>
                  </motion.div>
                ) : (
                  Object.entries(SUGGESTED_INTEGRATIONS).map(([category, platforms]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {platforms.map((platform) => {
                          const isSelected = selectedPlatforms.includes(platform.id);
                          return (
                            <button
                              key={platform.id}
                              onClick={() => togglePlatform(platform.id)}
                              className={`
                                relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                                ${isSelected
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                }
                              `}
                            >
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                                  <Check className="w-3 h-3" strokeWidth={3} />
                                </div>
                              )}
                              <div className="w-10 h-10 flex items-center justify-center">
                                <img
                                  src={platform.logo}
                                  alt={platform.name}
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium truncate w-full">{platform.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {!submitted && (
                <div className="p-6 border-t bg-muted/30 flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedPlatforms.length > 0
                      ? `${selectedPlatforms.length} integration${selectedPlatforms.length !== 1 ? 's' : ''} selected`
                      : 'Select integrations to request'
                    }
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitRequest}
                      disabled={selectedPlatforms.length === 0}
                    >
                      Submit Request
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
