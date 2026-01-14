'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleIntegrationAction(key: string, enabled: boolean) {
    const settingKey = 'integration_config';

    const currentSetting = await prisma.systemSetting.findUnique({
        where: { key: settingKey }
    });

    let config = (currentSetting?.value as Record<string, boolean>) || {};
    config[key] = enabled;

    await prisma.systemSetting.upsert({
        where: { key: settingKey },
        update: { value: config },
        create: { key: settingKey, value: config }
    });

    revalidatePath('/integrations');
}
