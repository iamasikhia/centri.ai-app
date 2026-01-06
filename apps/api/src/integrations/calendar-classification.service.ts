import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface CalendarEventContext {
    title: string;
    description: string;
    attendeesCount: number;
    hasConference: boolean;
    isSelfOrganized: boolean; // organizer email == user email
    durationMinutes: number;
}

export interface ClassificationResult {
    type: 'meeting' | 'task';
    confidence: number;
    reason: string;
}

@Injectable()
export class CalendarClassificationService {
    private openai: OpenAI | null = null;

    private readonly MEETING_KEYWORDS = [
        "call", "meeting", "sync", "standup", "interview", "review", "demo", "check-in", "1:1", "townhall"
    ];

    private readonly TASK_VERBS = [
        "work on", "finish", "submit", "write", "review", "prepare", "follow up", "send", "plan"
    ];

    private readonly TIME_BLOCKING_KEYWORDS = [
        "focus", "deep work", "personal", "admin", "study", "reading"
    ];

    constructor(private config: ConfigService) {
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        } else {
            console.warn("CalendarClassificationService: OPENAI_API_KEY missing");
        }
    }

    async classify(context: CalendarEventContext): Promise<ClassificationResult> {
        // 1. Layer 1: Rule-based
        const ruleResult = this.applyRules(context);

        // If classification is confident (>0.8), do NOT call LLM.
        if (ruleResult.confidence > 0.8) {
            return ruleResult;
        }

        // 2. Layer 2: LLM (Only if needed)
        if (!this.openai) {
            return ruleResult; // Fallback to rules if no LLM
        }

        return await this.callLLM(context);
    }

    private applyRules(ctx: CalendarEventContext): ClassificationResult {
        const titleLower = ctx.title.toLowerCase().trim();

        // Rule: Classify as MEETING if attendees > 1 OR has conference link OR organizer != user
        // Note: "organizer.email != user email" from prompt. ctx.isSelfOrganized is (organizer == user).
        // So !ctx.isSelfOrganized means organizer != user.
        const isStrongMeeting =
            ctx.attendeesCount > 1 ||
            ctx.hasConference ||
            !ctx.isSelfOrganized ||
            this.MEETING_KEYWORDS.some(k => titleLower.includes(k));

        if (isStrongMeeting) {
            // Refine confidence
            if (ctx.attendeesCount > 1 || ctx.hasConference) {
                return { type: 'meeting', confidence: 0.95, reason: 'Has multiple attendees or conference link' };
            }
            if (!ctx.isSelfOrganized) {
                return { type: 'meeting', confidence: 0.9, reason: 'Organized by someone else' };
            }
            if (this.MEETING_KEYWORDS.some(k => titleLower.includes(k))) {
                return { type: 'meeting', confidence: 0.85, reason: 'Matched meeting keyword' };
            }
            // Fallback if loose match
            return { type: 'meeting', confidence: 0.7, reason: 'Meeting signals present' };
        }

        // Rule: Classify as TASK if ALL: attendees <= 1 AND no conference AND task-like
        // Prompt says: attendees.length === 0 OR attendees only includes the user (so count <= 1 if self is included)
        if ((ctx.attendeesCount === 0 || ctx.attendeesCount === 1) && !ctx.hasConference) {
            const isTaskVerb = this.TASK_VERBS.some(k => titleLower.includes(k));
            const isTimeBlock = this.TIME_BLOCKING_KEYWORDS.some(k => titleLower.includes(k));

            if (isTaskVerb || isTimeBlock) {
                return { type: 'task', confidence: 0.9, reason: 'Solo event with task keywords' };
            }
        }

        // If we are here, it's ambiguous. Solo event, no conference, but no obvious task keyword.
        // E.g. "Project X"
        return { type: 'meeting', confidence: 0.4, reason: 'Ambiguous, defaulting to meeting' };
    }

    private async callLLM(ctx: CalendarEventContext): Promise<ClassificationResult> {
        try {
            const prompt = `
You are an executive assistant AI.
Classify the calendar event as either:
- "meeting"
- "task"

Rules:
- Meetings involve other people or real-time interaction.
- Tasks are solo work, reminders, or deadlines.

Return ONLY valid JSON.

Event:
Title: ${ctx.title}
Description: ${ctx.description || ''}
Attendees count: ${ctx.attendeesCount}
Has video link: ${ctx.hasConference}
Organizer is user: ${ctx.isSelfOrganized}
Duration minutes: ${ctx.durationMinutes}

Respond format:
{
  "type": "meeting | task",
  "confidence": 0.0-1.0,
  "reason": "short explanation"
}
`;
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o",
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            const result = JSON.parse(content);
            return {
                type: result.type,
                confidence: Number(result.confidence),
                reason: result.reason
            };
        } catch (e) {
            console.error('LLM Classification failed', e);
            return { type: 'meeting', confidence: 0.5, reason: 'LLM failed, default' };
        }
    }
}
