'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/contexts/subscription-context';

interface UpgradePromptProps {
    feature: string;
    description?: string;
    requiredTier?: 'pro' | 'team' | 'enterprise';
    className?: string;
}

export function UpgradePrompt({ feature, description, requiredTier = 'pro', className }: UpgradePromptProps) {
    const router = useRouter();
    const { tier } = useSubscription();

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <CardTitle>{feature} requires {requiredTier === 'pro' ? 'Pro' : requiredTier === 'team' ? 'Team' : 'Enterprise'}</CardTitle>
                        <CardDescription>
                            {description || `Upgrade to ${requiredTier} to unlock this feature.`}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="font-medium text-sm">With {requiredTier === 'pro' ? 'Pro' : requiredTier === 'team' ? 'Team' : 'Enterprise'}, you get:</div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {requiredTier === 'pro' && (
                                <>
                                    <li>• Unlimited integrations</li>
                                    <li>• Unlimited meetings</li>
                                    <li>• AI-powered insights</li>
                                    <li>• Codebase intelligence</li>
                                    <li>• Chat copilot</li>
                                    <li>• Stakeholder management</li>
                                </>
                            )}
                        </ul>
                    </div>
                    <Button
                        onClick={() => router.push('/pricing')}
                        className="w-full"
                        size="lg"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Upgrade to {requiredTier === 'pro' ? 'Pro' : requiredTier === 'team' ? 'Team' : 'Enterprise'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

