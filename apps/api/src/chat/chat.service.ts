
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UIResponse, Intent, UIBlock, SourceCheck, UIListItem } from './types';
import { isPhysicalMeeting, MeetingInfo } from './logic/meeting-analysis';
import * as crypto from 'crypto';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
    private openai: OpenAI;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService
    ) {
        this.openai = new OpenAI({
            apiKey: this.config.get('OPENAI_API_KEY'),
        });
    }

    async processMessage(userId: string, message: string): Promise<UIResponse> {
        const intent = this.classifyIntent(message);
        const start = Date.now();

        let response: Partial<UIResponse> = {};
        const debug: { sourcesChecked: SourceCheck[], latencyMs?: number } = { sourcesChecked: [] };

        const addCheck = (c: SourceCheck) => debug.sourcesChecked.push(c);

        try {
            if (intent === 'get_team_members') {
                response = await this.handleGetTeamMembers(userId, addCheck);
            } else if (intent === 'get_next_meeting') {
                response = await this.handleGetNextMeeting(userId, addCheck);
            } else if (intent === 'is_next_meeting_physical') {
                response = await this.handleIsNextMeetingPhysical(userId, addCheck);
            } else if (intent === 'help_connect_integrations') {
                response = this.handleConnectIntegrations();
            } else {
                // LLM Semantic Routing (Best Reasoning Mode)
                response = await this.handleUnknownIntent(userId, message, addCheck);
            }
        } catch (e) {
            console.error(e);
            response = {
                title: "Error",
                blocks: [{ type: "callout", tone: "danger", title: "System Error", body: "Something went wrong processing your request." }]
            };
        }

        return {
            kind: "ui_response",
            requestId: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            intent,
            title: response.title,
            subtitle: response.subtitle,
            blocks: response.blocks || [],
            debug: { ...debug, latencyMs: Date.now() - start }
        };
    }

    private classifyIntent(msg: string): Intent {
        const lower = msg.toLowerCase();
        // Keep deterministic regex for speed/reliability on obvious queries
        if (lower.match(/physical|in person|virtual|remote|where.*meeting/)) return 'is_next_meeting_physical';
        if (lower.match(/team|members|people|staff|who works/)) return 'get_team_members';
        if (lower.match(/next meeting|upcoming meeting/)) return 'get_next_meeting';
        if (lower.match(/connect|integrations|setup|configure/)) return 'help_connect_integrations';
        return 'unknown';
    }

    private async handleUnknownIntent(userId: string, message: string, addCheck: (c: SourceCheck) => void): Promise<Partial<UIResponse>> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are Centri. Analyze the user's request. If it matches a specific capability (Checking Meeting, Checking Team), call the corresponding tool function. Otherwise, answer the question helpfully using Markdown." },
                    { role: "user", content: message }
                ],
                model: "gpt-4o",
                tools: [
                    { type: "function", function: { name: "get_next_meeting", description: "Get details about the next upcoming meeting" } },
                    { type: "function", function: { name: "get_team_members", description: "Get list of team members from Slack" } },
                    { type: "function", function: { name: "is_next_meeting_physical", description: "Check if the next meeting is physical, virtual, or in-person" } },
                    { type: "function", function: { name: "connect_integration", description: "Help user connect integrations like Slack or Calendar" } }
                ],
                tool_choice: "auto"
            });

            const choice = completion.choices[0].message;

            // Prioritize Tool Use (Reasoning)
            if (choice.tool_calls && choice.tool_calls.length > 0) {
                const toolCall = choice.tool_calls[0];
                const fn = (toolCall as any).function.name;
                // Delegate to internal handlers
                if (fn === 'get_next_meeting') return await this.handleGetNextMeeting(userId, addCheck);
                if (fn === 'get_team_members') return await this.handleGetTeamMembers(userId, addCheck);
                if (fn === 'is_next_meeting_physical') return await this.handleIsNextMeetingPhysical(userId, addCheck);
                if (fn === 'connect_integration') return this.handleConnectIntegrations();
            }

            // Fallback to text
            const text = choice.content || "I'm sorry, I couldn't generate a response.";
            return {
                title: "Centri",
                blocks: [{ type: "text", markdown: text }]
            };

        } catch (e) {
            console.error("LLM Error", e);
            return {
                title: "Error",
                blocks: [{ type: "callout", tone: "danger", title: "AI Error", body: "Could not connect to AI service." }]
            };
        }
    }

    private async handleGetTeamMembers(userId: string, addCheck: (c: SourceCheck) => void): Promise<Partial<UIResponse>> {
        const creds = await this.prisma.integrations.findFirst({
            where: { userId, provider: 'slack' }
        });

        if (!creds) {
            addCheck({ source: 'slack', status: 'not_connected', message: 'No Slack credentials found' });
            return {
                title: "Team Members",
                blocks: [
                    { type: "text", markdown: "I noticed you haven't connected Slack yet. Connect it to see your team." },
                    {
                        type: "callout",
                        tone: "warning",
                        title: "Slack not connected",
                        body: "Connect Slack to see your team members.",
                        actions: [{ type: "button", label: "Connect Slack", action: "connect_integration", params: { provider: "slack" } }]
                    }
                ]
            };
        }

        addCheck({ source: 'slack', status: 'connected' });

        const members = await this.prisma.teamMember.findMany({ where: { userId } });

        if (members.length === 0) {
            addCheck({ source: 'slack', status: 'checked_empty', itemCount: 0 });
            return {
                title: "Team Members",
                blocks: [
                    { type: "text", markdown: "I'm connected to Slack, but I couldn't find any team members synced yet." },
                    {
                        type: "callout",
                        tone: "info",
                        title: "No members found",
                        body: "Try syncing again.",
                        actions: [{ type: "button", label: "Sync Now", action: "sync_now", params: { provider: "slack" } }]
                    }
                ]
            };
        }

        addCheck({ source: 'slack', status: 'checked_ok', itemCount: members.length });

        return {
            title: "Team Members",
            blocks: [
                { type: "text", markdown: `I found **${members.length} team members** connected via Slack:` },
                {
                    type: "list",
                    title: "Team Members",
                    items: members.map(m => ({
                        title: m.name || m.email || 'Unknown',
                        subtitle: m.email || 'No email',
                        avatarUrl: m.avatarUrl || undefined,
                        badges: [{ label: 'Slack', tone: 'neutral' }]
                    } as UIListItem))
                }
            ]
        };
    }

    private async handleGetNextMeeting(userId: string, addCheck: (c: SourceCheck) => void): Promise<Partial<UIResponse>> {
        const creds = await this.prisma.integrations.findFirst({
            where: { userId, provider: 'google' }
        });

        if (!creds) {
            addCheck({ source: 'google_calendar', status: 'not_connected' });
            return {
                title: "Next Meeting",
                blocks: [
                    { type: "text", markdown: "You need to connect Google Calendar first." },
                    {
                        type: "callout",
                        tone: "warning",
                        title: "Calendar not connected",
                        body: "Connect Google Calendar to see your meetings.",
                        actions: [{ type: "button", label: "Connect Calendar", action: "connect_integration", params: { provider: "google_calendar" } }]
                    }
                ]
            };
        }

        addCheck({ source: 'google_calendar', status: 'connected' });

        const now = new Date();
        const next = await this.prisma.meeting.findFirst({
            where: { userId, startTime: { gt: now } },
            orderBy: { startTime: 'asc' }
        });

        if (!next) {
            addCheck({ source: 'google_calendar', status: 'checked_empty' });
            return {
                title: "Next Meeting",
                blocks: [
                    { type: "text", markdown: "No upcoming meetings found in your calendar for today." }
                ]
            };
        }

        addCheck({ source: 'google_calendar', status: 'checked_ok', itemCount: 1 });

        const n = next as any;
        const meetLink = n.meetLink;
        const location = n.location;
        const htmlLink = n.htmlLink;

        const timeStr = new Date(n.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return {
            title: "Next Meeting",
            blocks: [
                { type: "text", markdown: `Your next meeting is **${n.title}** at **${timeStr}**:` },
                {
                    type: "event",
                    title: n.title,
                    start: n.startTime.toISOString(),
                    end: n.endTime.toISOString(),
                    location: location || (meetLink ? 'Google Meet' : undefined),
                    action: meetLink
                        ? { type: 'button', label: 'Join Meeting', action: 'open_url', params: { url: meetLink } }
                        : (htmlLink ? { type: 'link', label: 'View Event', href: htmlLink } : undefined)
                }
            ]
        };
    }

    private async handleIsNextMeetingPhysical(userId: string, addCheck: (c: SourceCheck) => void): Promise<Partial<UIResponse>> {
        const creds = await this.prisma.integrations.findFirst({
            where: { userId, provider: 'google' }
        });

        if (!creds) {
            addCheck({ source: 'google_calendar', status: 'not_connected' });
            return {
                title: "Next Meeting",
                blocks: [
                    { type: "callout", tone: "warning", title: "Calendar not connected", body: "Connect Google Calendar to answer this." }
                ]
            };
        }

        const now = new Date();
        const next = await this.prisma.meeting.findFirst({
            where: { userId, startTime: { gt: now } },
            orderBy: { startTime: 'asc' }
        });

        if (!next) {
            return {
                title: "Next Meeting",
                blocks: [
                    { type: "text", markdown: "No upcoming meetings found." }
                ]
            };
        }

        const n = next as any;
        const info: MeetingInfo = {
            location: n.location,
            description: n.description,
            meetLink: n.meetLink,
            htmlLink: n.htmlLink
        };

        const analysis = isPhysicalMeeting(info);

        return {
            title: "Meeting Analysis",
            blocks: [
                {
                    type: "text",
                    markdown: analysis.reason
                },
                ...(analysis.evidence.length > 0 ? [{
                    type: "list",
                    title: "Evidence",
                    items: analysis.evidence.map(e => ({ title: e.label, subtitle: e.value } as UIListItem))
                } as UIBlock] : []),
                {
                    type: "event",
                    title: n.title,
                    start: n.startTime.toISOString(),
                    end: n.endTime.toISOString(),
                    location: n.location || (n.meetLink ? 'Google Meet' : undefined),
                    action: n.htmlLink ? { type: "link", label: "Open in Calendar", href: n.htmlLink } : undefined
                }
            ]
        };
    }

    private handleConnectIntegrations(): Partial<UIResponse> {
        return {
            title: "Connect Integrations",
            blocks: [
                { type: "text", markdown: "Here are the integrations you can connect:" },
                {
                    type: "list",
                    title: "Available Integrations",
                    items: [
                        { title: "Slack", subtitle: "For team and messages", badges: [{ label: 'Chat', tone: 'neutral' }] },
                        { title: "Google Calendar", subtitle: "For meetings", badges: [{ label: 'Calendar', tone: 'neutral' }] },
                        { title: "Google Meet", subtitle: "Video conferencing", badges: [{ label: 'Video', tone: 'neutral' }] },
                        { title: "Microsoft Teams", subtitle: "Chat & Meetings", badges: [{ label: 'Chat', tone: 'neutral' }] },
                        { title: "Fathom", subtitle: "AI Meeting Recorder", badges: [{ label: 'AI', tone: 'good' }] }
                    ]
                },
                {
                    type: "text",
                    markdown: "Go to Settings > Integrations to setup."
                },
                {
                    type: "button", label: "Go to Settings", action: "connect_integration", params: { provider: "all" }
                } as any
            ]
        };
    }
}
