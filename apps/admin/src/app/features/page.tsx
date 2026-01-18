'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, Eye, EyeOff, Settings, Home, Mic, BookOpen, CheckSquare, CalendarCheck, Briefcase, Sparkles, Zap, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatureFlag {
    key: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

interface FeatureConfig {
    key: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'main' | 'footer';
    defaultEnabled: boolean;
}

const FEATURE_CONFIGS: FeatureConfig[] = [
    // Main navigation items
    {
        key: 'feature-dashboard',
        label: 'Dashboard',
        description: 'Main dashboard page',
        icon: Home,
        category: 'main',
        defaultEnabled: true,
    },
    {
        key: 'feature-meetings',
        label: 'Meetings',
        description: 'Meetings and transcripts',
        icon: Mic,
        category: 'main',
        defaultEnabled: true,
    },
    {
        key: 'feature-codebase',
        label: 'Codebase Intelligence',
        description: 'Codebase overview and analysis',
        icon: BookOpen,
        category: 'main',
        defaultEnabled: true,
    },
    {
        key: 'feature-tasks',
        label: 'Tasks',
        description: 'Task management',
        icon: CheckSquare,
        category: 'main',
        defaultEnabled: true,
    },
    {
        key: 'feature-checkins',
        label: 'CheckIns',
        description: 'Daily check-ins and questions',
        icon: CalendarCheck,
        category: 'main',
        defaultEnabled: true,
    },
    {
        key: 'feature-stakeholders',
        label: 'Stakeholders',
        description: 'Stakeholder management',
        icon: Briefcase,
        category: 'main',
        defaultEnabled: true,
    },
    // Footer navigation items
    {
        key: 'feature-work-wrapped',
        label: 'Work Wrapped',
        description: 'Year-end work summary',
        icon: Sparkles,
        category: 'footer',
        defaultEnabled: true,
    },
    {
        key: 'feature-integrations',
        label: 'Integrations',
        description: 'Integration settings',
        icon: Zap,
        category: 'footer',
        defaultEnabled: true,
    },
    {
        key: 'feature-settings',
        label: 'Settings',
        description: 'User settings',
        icon: Settings2,
        category: 'footer',
        defaultEnabled: true,
    },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function FeaturesPage() {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const fetchFeatureFlags = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/features`);
            if (res.ok) {
                const data = await res.json();
                setFeatureFlags(data);
            } else {
                console.error('Failed to fetch feature flags:', res.status);
                setFeatureFlags([]);
            }
        } catch (e) {
            console.error('Error fetching feature flags:', e);
            setFeatureFlags([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatureFlags();
    }, []);

    const toggleFeature = async (key: string, enabled: boolean) => {
        setSaving(key);
        try {
            const res = await fetch(`${API_URL}/features/${key}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            });

            if (res.ok) {
                // Update local state
                setFeatureFlags((prev) => {
                    const existing = prev.find((f) => f.key === key);
                    if (existing) {
                        return prev.map((f) => (f.key === key ? { ...f, enabled } : f));
                    } else {
                        return [...prev, { key, enabled, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
                    }
                });
            } else {
                console.error('Failed to update feature flag:', res.status);
                alert('Failed to update feature flag. Please try again.');
            }
        } catch (e) {
            console.error('Error updating feature flag:', e);
            alert('Error updating feature flag. Please try again.');
        } finally {
            setSaving(null);
        }
    };

    const getFeatureEnabled = (key: string): boolean => {
        const flag = featureFlags.find((f) => f.key === key);
        if (flag) return flag.enabled;
        const config = FEATURE_CONFIGS.find((c) => c.key === key);
        return config?.defaultEnabled ?? true;
    };

    const mainFeatures = FEATURE_CONFIGS.filter((f) => f.category === 'main');
    const footerFeatures = FEATURE_CONFIGS.filter((f) => f.category === 'footer');

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-8 max-w-[1200px] mx-auto pb-20">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-8 max-w-[1200px] mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Visibility Control</h1>
                    <p className="text-muted-foreground mt-1">
                        Control which features appear in the main app sidebar menu.
                    </p>
                </div>
                <Button onClick={fetchFeatureFlags} variant="outline" className="gap-2" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Main Navigation Features */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Main Navigation
                    </CardTitle>
                    <CardDescription>
                        Control visibility of primary navigation items in the sidebar
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mainFeatures.map((feature) => {
                        const enabled = getFeatureEnabled(feature.key);
                        const isSaving = saving === feature.key;
                        const Icon = feature.icon;

                        return (
                            <div
                                key={feature.key}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={feature.key} className="font-medium cursor-pointer">
                                                {feature.label}
                                            </Label>
                                            {enabled ? (
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isSaving && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
                                    <Switch
                                        id={feature.key}
                                        checked={enabled}
                                        onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Footer Navigation Features */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Footer Navigation
                    </CardTitle>
                    <CardDescription>
                        Control visibility of footer navigation items in the sidebar
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {footerFeatures.map((feature) => {
                        const enabled = getFeatureEnabled(feature.key);
                        const isSaving = saving === feature.key;
                        const Icon = feature.icon;

                        return (
                            <div
                                key={feature.key}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={feature.key} className="font-medium cursor-pointer">
                                                {feature.label}
                                            </Label>
                                            {enabled ? (
                                                <Eye className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">{feature.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isSaving && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
                                    <Switch
                                        id={feature.key}
                                        checked={enabled}
                                        onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

