
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UpdateItem } from '@prisma/client';

@Injectable()
export class UpdatesService {
    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
        private config: ConfigService
    ) { }

    async refreshUpdates(userId: string) {
        const integrations = await this.prisma.integrations.findMany({ where: { userId } });
        const checks: Record<string, any> = {
            gmail: { status: 'not_connected', count: 0 },
            slack: { status: 'not_connected', count: 0 },
            github: { status: 'not_connected', count: 0 },
            google_calendar: { status: 'not_connected', count: 0 },
        };

        const updates: any[] = [];

        // Map providers to logic
        for (const integ of integrations) {
            let token: string | null = null;
            if (integ.encryptedBlob) {
                try {
                    const decrypted = this.encryption.decrypt(integ.encryptedBlob);
                    const t = JSON.parse(decrypted);
                    token = t.access_token;
                } catch (e) {
                    console.error(`Failed to decrypt token for ${integ.provider}`, e);
                }
            } else {
                token = integ.accessToken;
            }

            console.log(`Processing ${integ.provider}, hasToken: ${!!token}`);

            if (!token) {
                if (checks[integ.provider]) checks[integ.provider].status = 'error';
                continue;
            }

            // Calendar (provider: 'google')
            if (integ.provider === 'google') {
                checks.google_calendar.status = 'checked_empty';
                const items = await this.collectCalendar(userId, token);
                if (items.length > 0) checks.google_calendar.status = 'checked_ok';
                checks.google_calendar.count = items.length;
                updates.push(...items);
            }

            // Gmail (provider: 'gmail' or reuse 'google' if scope allows?)
            // We'll look for 'gmail' specific provider first, generally.
            if (integ.provider === 'gmail') {
                checks.gmail.status = 'checked_empty';
                const items = await this.collectGmail(userId, token);
                if (items.length > 0) checks.gmail.status = 'checked_ok';
                checks.gmail.count = items.length;
                updates.push(...items);
            }

            // Slack
            if (integ.provider === 'slack') {
                checks.slack.status = 'checked_empty';
                const items = await this.collectSlack(userId, token);
                if (items.length > 0) checks.slack.status = 'checked_ok';
                checks.slack.count = items.length;
                updates.push(...items);
            }

            // GitHub
            if (integ.provider === 'github') {
                checks.github.status = 'checked_empty';
                const items = await this.collectGitHub(userId, token);
                if (items.length > 0) checks.github.status = 'checked_ok';
                checks.github.count = items.length;
                updates.push(...items);
            }
        }

        // Upsert logic
        for (const item of updates) {
            await this.prisma.updateItem.upsert({
                where: {
                    userId_source_externalId: {
                        userId: item.userId,
                        source: item.source,
                        externalId: item.externalId
                    }
                },
                update: {
                    // Update content but preserve read status
                    title: item.title,
                    body: item.body,
                    severity: item.severity,
                    occurredAt: item.occurredAt,
                    metadata: item.metadata
                },
                create: item
            });
        }

        return {
            items: await this.getUpdates(userId),
            sourceChecks: Object.entries(checks).map(([k, v]) => ({ source: k, ...v })),
            lastRefreshedAt: new Date().toISOString()
        };
    }

    async getUpdates(userId: string) {
        return this.prisma.updateItem.findMany({
            where: { userId, isDismissed: false },
            orderBy: { occurredAt: 'desc' },
            take: 50
        });
    }

    async markRead(id: string, userId: string) {
        return this.prisma.updateItem.update({ where: { id }, data: { isRead: true } });
    }

    async dismiss(id: string, userId: string) {
        return this.prisma.updateItem.update({ where: { id }, data: { isDismissed: true } });
    }

    async getNewsletters(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.updateItem.findMany({
            where: {
                userId,
                type: 'newsletter',
                isDismissed: false,
                occurredAt: {
                    gte: today
                }
            },
            orderBy: { occurredAt: 'desc' },
            take: 50
        });
    }

    // --- COLLECTORS ---

    private async collectGmail(userId: string, token: string): Promise<any[]> {
        const items = [];
        try {
            // Broaden search to catch newsletters (Updates/Promotions often hold them)
            // Fetch last 7 days to cover weekly digests
            const listRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
                params: { q: 'newer_than:7d', maxResults: 30 },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (listRes.data.messages) {
                // Fetch details
                await Promise.all(listRes.data.messages.map(async (msg: any) => {
                    try {
                        const detail = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = detail.data;
                        const headers = data.payload.headers || [];
                        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                        const from = headers.find((h: any) => h.name === 'From')?.value || '';

                        // --- NEWSLETTER DETECTION ---
                        const listUnsubscribe = headers.find((h: any) => h.name === 'List-Unsubscribe');
                        const lowerSub = subject.toLowerCase();
                        const lowerFrom = from.toLowerCase();

                        // Heuristic Score
                        let isNewsletter = false;
                        if (listUnsubscribe) isNewsletter = true;
                        if (lowerSub.match(/newsletter|digest|weekly|roundup|edition|update|launch|trends/)) isNewsletter = true;
                        if (lowerFrom.includes('substack') || lowerFrom.includes('linkedin') || lowerFrom.includes('news')) isNewsletter = true;

                        const snippet = data.snippet;
                        const date = new Date(parseInt(data.internalDate));

                        if (isNewsletter) {
                            // --- NEWSLETTER ---
                            items.push({
                                userId,
                                source: 'gmail',
                                type: 'newsletter',
                                severity: 'info',
                                title: subject,
                                body: this.generateSummary(snippet), // AI Summary Stub
                                occurredAt: date,
                                externalId: msg.id,
                                url: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
                                metadata: {
                                    from,
                                    senderName: from.split('<')[0].replace(/"/g, '').trim(),
                                    originalSnippet: snippet
                                }
                            });
                        } else {
                            // --- REGULAR UPDATE (Existing Logic) ---
                            // Only unread, urgent, or specific categories
                            const labels = data.labelIds || [];
                            const isUnread = labels.includes('UNREAD');
                            // Skip promotions/social for regular feed if not newsletter
                            // But our query included them, so we must filter them out manually for "regular updates"
                            // Actually, let's keep the user's focus clean. 

                            const isUrgent = lowerSub.match(/urgent|asap|immediate|action required|important|deadline/);
                            const isNoReply = lowerFrom.includes('no-reply') || lowerFrom.includes('noreply');

                            // Only keep if Unread AND (Urgent OR Important OR Not No-Reply)
                            // This reduces noise from the broader query
                            if (isUnread && (isUrgent || !isNoReply)) {
                                let severity = 'info';
                                if (isUrgent) severity = 'urgent';
                                else if (lowerSub.match(/review|approve|contract|invoice|meeting|schedule/)) severity = 'important';

                                items.push({
                                    userId,
                                    source: 'gmail',
                                    type: 'email',
                                    severity,
                                    title: subject,
                                    body: snippet,
                                    occurredAt: date,
                                    externalId: msg.id,
                                    url: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
                                    metadata: { labels: data.labelIds, from }
                                });
                            }
                        }
                    } catch (e) { }
                }));
            }
        } catch (e) {
            console.error('Gmail collect error', e.message);
        }
        return items;
    }

    private generateSummary(text: string): string {
        // Pseudo-AI summarization
        // In real world, send to LLM. Here, we extract the first meaningful sentence or clean up the snippet.
        // Remove common newsletter clutter
        let summary = text
            .replace(/View in browser|Unsubscribe|Click here|trouble viewing/gi, '')
            .trim();

        if (summary.length > 150) {
            summary = summary.substring(0, 147) + '...';
        }
        return summary;
    }

    private async collectGitHub(userId: string, token: string): Promise<any[]> {
        const items = [];
        try {
            // Get user info for login
            const userRes = await axios.get('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}` } });
            const username = userRes.data.login;

            // Events
            const eventsRes = await axios.get(`https://api.github.com/users/${username}/received_events`, { // received_events = organization/repo activity
                headers: { Authorization: `Bearer ${token}` },
                params: { per_page: 20 }
            });

            for (const ev of eventsRes.data) {
                if (ev.type === 'PushEvent') {
                    const branch = ev.payload.ref.replace('refs/heads/', '');
                    const isMain = branch === 'main' || branch === 'master';
                    const severity = isMain ? 'urgent' : 'info';
                    items.push({
                        userId,
                        source: 'github',
                        type: 'github_push',
                        severity,
                        title: `Push to ${branch} in ${ev.repo.name}`,
                        body: `${ev.payload.commits?.[0]?.message || 'New commits'}`,
                        occurredAt: new Date(ev.created_at),
                        externalId: ev.id,
                        url: `https://github.com/${ev.repo.name}/commits/${branch}`, // Approximate
                        metadata: { repo: ev.repo.name }
                    });
                }
                if (ev.type === 'PullRequestEvent' && (ev.payload.action === 'opened' || ev.payload.action === 'closed')) {
                    const pr = ev.payload.pull_request;
                    const isMerged = pr.merged;
                    const base = pr.base.ref;
                    let severity = 'info';
                    if (ev.payload.action === 'opened') severity = 'important';
                    if (isMerged && (base === 'main' || base === 'master')) severity = 'urgent';

                    items.push({
                        userId,
                        source: 'github',
                        type: 'github_pr',
                        severity,
                        title: `PR ${ev.payload.action}: ${pr.title}`,
                        body: `Repo: ${ev.repo.name} by ${ev.actor.login}`,
                        occurredAt: new Date(ev.created_at),
                        externalId: ev.id,
                        url: pr.html_url,
                        metadata: { repo: ev.repo.name, action: ev.payload.action }
                    });
                }
            }
        } catch (e) {
            console.error('GitHub collect error', e.message);
        }
        return items;
    }

    private async collectCalendar(userId: string, token: string): Promise<any[]> {
        const items = [];
        try {
            const start = new Date().toISOString();
            const end = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

            const res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.items) {
                for (const ev of res.data.items) {
                    const startTime = new Date(ev.start.dateTime || ev.start.date);
                    const diffHours = (startTime.getTime() - Date.now()) / (3600 * 1000);
                    let severity = 'info';
                    if (diffHours >= 0 && diffHours < 4) severity = 'urgent';
                    else if (diffHours >= 0 && diffHours < 24) severity = 'important';

                    items.push({
                        userId,
                        source: 'google_calendar',
                        type: 'calendar_event',
                        severity,
                        title: ev.summary || 'No Title',
                        body: `${startTime.toLocaleTimeString()} • ${ev.attendees?.length || 0} attendees`,
                        occurredAt: startTime, // Event time as "occurred"? Or when checking? Prompt says: "meeting starts within next 4 hours...". UpdateItem "occurredAt" usually means creation time of the update. I'll use event time for sorting purpose or Date.now() if it's "New meeting scheduled"?
                        // Prompt: "New meetings scheduled/changed... events created/updated in last 48h".
                        // I'll check created/updated timestamp of event.
                        // Actually, sorting by event time is better for a schedule view, but "Updates" implies "Recently changed".
                        // I'll use ev.updated if available, else date.now.
                        // But wait, user wants "Unified feed sorted by timestamp".
                        // Use ev.updated for "New Update".
                        externalId: ev.id + '_' + (ev.updated || ''), // Make unique per update version? Or just ev.id unique?
                        // If I use ev.id, upsert overwrites.
                        // I'll use ev.id and always update 'occurredAt' to meeting time? No.
                        // I'll use meeting start time for now as it's most relevant context.
                        url: ev.htmlLink,
                        metadata: { location: ev.location }
                    });
                }
            }
        } catch (e) { console.error('Calendar collect error', e.message); }
        return items;
    }

    private async collectSlack(userId: string, token: string): Promise<any[]> {
        const items = [];
        try {
            // 1. Get channels (Limit 5)
            const listRes = await axios.get('https://slack.com/api/conversations.list', {
                headers: { Authorization: `Bearer ${token}` },
                params: { types: 'public_channel,private_channel', limit: 5 }
            });

            if (listRes.data.channels) {
                let hasAuthError = false;
                let notInChannelCount = 0;

                for (const ch of listRes.data.channels) {
                    const histRes = await axios.get('https://slack.com/api/conversations.history', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { channel: ch.id, limit: 5 }
                    });

                    if (!histRes.data.ok) {
                        if (histRes.data.error === 'not_in_channel') notInChannelCount++;
                        else console.warn(`Slack history error for ${ch.name}:`, histRes.data.error);
                        continue;
                    }

                    if (histRes.data.messages) {
                        for (const msg of histRes.data.messages) {
                            if (!msg.text || msg.subtype) continue;

                            let severity = 'info';
                            const lower = msg.text.toLowerCase();
                            if (lower.match(/urgent|asap|blocker|p0|@channel|@here/)) severity = 'urgent';

                            items.push({
                                userId,
                                source: 'slack',
                                type: 'slack_message',
                                severity,
                                title: `Message in #${ch.name}`,
                                body: msg.text,
                                occurredAt: new Date(parseFloat(msg.ts) * 1000),
                                externalId: ch.id + '_' + msg.ts,
                                url: `https://slack.com/app_redirect?channel=${ch.id}`,
                                metadata: { channel: ch.name, sender: msg.user }
                            });
                        }
                    }
                }

                // If we found channels but got 'not_in_channel' for all/some and no items, assume we need to join.
                if (items.length === 0 && notInChannelCount > 0 && listRes.data.channels.length > 0) {
                    // Create a system guidance update
                    items.push({
                        userId,
                        source: 'slack',
                        type: 'system_alert',
                        severity: 'important',
                        title: 'Slack Connection: Action Required',
                        body: 'I am connected but need to be added to channels to see messages. Please invite @Centri to your channels.',
                        occurredAt: new Date(),
                        externalId: 'slack_setup_hint',
                        url: null,
                        metadata: {}
                    });
                }
            }
        } catch (e) {
            console.error('Slack collect error', e.message);
        }
        return items;
    }
}
