'use client';

import { Switch } from '@/components/ui/switch';
import { toggleIntegrationAction } from './actions';
import { useState } from 'react';
import { useTransition } from 'react';

interface IntegrationToggleProps {
    integrationKey: string;
    defaultEnabled: boolean;
}

export function IntegrationToggle({ integrationKey, defaultEnabled }: IntegrationToggleProps) {
    const [enabled, setEnabled] = useState(defaultEnabled);
    const [isPending, startTransition] = useTransition();

    const handleToggle = (checked: boolean) => {
        setEnabled(checked);
        startTransition(() => {
            toggleIntegrationAction(integrationKey, checked);
        });
    };

    return (
        <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
        />
    );
}
