import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/google-calendar";
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper to identify intent (mocking AI for now)
function identifyIntent(message: string): 'meeting' | 'task' | 'blocker' | 'team' | 'slack' | 'general' {
    const msg = message.toLowerCase();
    if (msg.includes('meeting') || msg.includes('calendar') || msg.includes('schedule')) return 'meeting';
    if (msg.includes('task') || msg.includes('todo') || msg.includes('focus')) return 'task';
    if (msg.includes('blocker') || msg.includes('stuck')) return 'blocker';
    if (msg.includes('slack') || msg.includes('channel') || msg.includes('workspace')) return 'slack';
    if (msg.includes('team') || msg.includes('who') || msg.includes('member')) return 'team';
    return 'general';
}

// Generate AI-powered responses using OpenAI
async function generateAIResponse(userMessage: string, intent: string, data: any): Promise<string> {
    try {
        const contextData = JSON.stringify({
            meetings: data.meetings?.slice(0, 5) || [],
            tasks: data.tasks?.slice(0, 5) || [],
            blockers: data.blockers || [],
            slackMembers: data.slackMembers?.slice(0, 5) || [],
            slackActivity: data.slackActivity || []
        }, null, 2);

        const systemPrompt = `You are Centri, an AI assistant that helps users manage their work. You have access to the user's:
- Calendar meetings
- Tasks and focus items
- Blockers
- Slack team members and recent channel activity

Provide helpful, concise, and friendly responses. 
If the user asks for a summary of Slack or what is happenning, use the 'slackActivity' data to provide a concise summary of discussions.
If the user asks about team members, list their names.
If asked about meetings, show dates and times.
Keep responses conversational but professional.`;

        const userPrompt = `User question: "${userMessage}"

Available data:
${contextData}

Please answer the user's question based on this data. Be specific and helpful.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        return completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
    } catch (error) {
        console.error("OpenAI Error:", error);
        return generateFallbackResponse(intent, data);
    }
}

// Fallback response generation (used if OpenAI fails)
function generateFallbackResponse(intent: string, data: any): string {
    if (intent === 'team' || intent === 'slack') {
        const members = data.slackMembers || [];
        if (members.length === 0) {
            return "I couldn't find any team members. Make sure Slack is connected.";
        }
        const memberNames = members.map((m: any) => m.name).join(', ');
        return `Here are your team members: ${memberNames}. You have ${members.length} members total.`;
    }

    if (intent === 'meeting') {
        const meetings = data.meetings || [];
        if (meetings.length === 0) {
            return "You don't have any upcoming meetings in the next 7 days.";
        }
        const meetingList = meetings.slice(0, 3).map((m: any) =>
            `• ${m.title} on ${new Date(m.startTime).toLocaleDateString()}`
        ).join('\n');
        return `You have ${meetings.length} upcoming meetings. Here are the next few:\n${meetingList}`;
    }

    if (intent === 'task') {
        const tasks = data.tasks || [];
        if (tasks.length === 0) {
            return "You don't have any focus tasks at the moment.";
        }
        const taskList = tasks.slice(0, 3).map((t: any) =>
            `• ${t.title} (${t.assigneeEmail || 'Unassigned'})`
        ).join('\n');
        return `You have ${tasks.length} focus tasks. Here are your top priorities:\n${taskList}`;
    }

    if (intent === 'blocker') {
        const blockers = data.blockers || [];
        if (blockers.length === 0) {
            return "Great news! You don't have any active blockers.";
        }
        const blockerList = blockers.map((b: any) =>
            `• ${b.title} (${b.assigneeEmail || 'Unknown'})`
        ).join('\n');
        return `You have ${blockers.length} blockers that need attention:\n${blockerList}`;
    }

    return "I've gathered the information you requested. Check the details below.";
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { message } = await req.json();
        const intent = identifyIntent(message);

        // Define steps based on intent
        const steps: any[] = [];
        let initialMessage = "I'll help you with that.";
        if (intent === 'meeting') initialMessage = "I'll check your calendar.";
        if (intent === 'task') initialMessage = "I'll search your tasks.";
        if (intent === 'slack') initialMessage = "I'll fetch your Slack activity and members.";

        // Fetch Data
        let calendarData: any = { events: [] };
        let slackData: any = { channels: [], members: [], activity: [] };
        let dashboardData: any = {};

        // 1. Calendar
        if (intent === 'meeting' || intent === 'general') {
            if (session.accessToken) {
                try {
                    const events = await getCalendarEvents(session.accessToken as string);
                    calendarData = { events };
                } catch (e: any) { calendarData = { error: true }; }
            }
        }

        // 2. Dashboard
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        if (intent === 'task' || intent === 'blocker' || intent === 'general') {
            try {
                const res = await fetch(`${API_URL}/dashboard`, { headers: { 'x-user-id': 'default-user-id' } });
                if (res.ok) dashboardData = await res.json();
            } catch (e) { }
        }

        // 3. Slack (Channels, Members, and Activity)
        if (intent === 'slack' || intent === 'team' || intent === 'general') {
            try {
                // Fetch basic data
                const res = await fetch(`${API_URL}/slack/channels`, { headers: { 'x-user-id': 'default-user-id' } });
                if (res.ok) {
                    const basic = await res.json();
                    slackData.channels = basic.channels;
                    slackData.members = basic.members;
                }

                // Fetch recent activity for summaries
                if (intent === 'slack' || intent === 'general') {
                    const actRes = await fetch(`${API_URL}/slack/activity`, { headers: { 'x-user-id': 'default-user-id' } });
                    if (actRes.ok) {
                        const actData = await actRes.json();
                        slackData.activity = actData.activity || [];
                    }
                }
            } catch (e) {
                console.error("Slack API Error:", e);
            }
        }

        const naturalResponse = await generateAIResponse(message, intent, {
            meetings: calendarData?.events || [],
            tasks: dashboardData?.focusTasks || [],
            blockers: dashboardData?.blockers || [],
            slackMembers: slackData?.members || [],
            slackChannels: slackData?.channels || [],
            slackActivity: slackData?.activity || []
        });

        // Build Response Structure
        const responseData = {
            intent,
            initialMessage,
            response: naturalResponse,
            steps,
            data: {
                meetings: calendarData?.events || [],
                slackActivity: slackData?.activity || []
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
