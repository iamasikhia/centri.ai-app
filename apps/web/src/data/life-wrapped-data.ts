export interface WrappedData {
    period: string;
    timeOverview: {
        totalHours: number;
        meetingHours: number;
        meetingCount: number;
        avgMeetingLengthMinutes: number;
        focusPercentage: number;
        copy: string;
    };
    meetingsBreakdown: {
        total: number;
        oneOnOne: number;
        team: number;
        stakeholder: number;
        longestMeeting: string;
        shortestMeeting: string;
        insight: string;
    };
    work: {
        completed: number;
        created: number;
        open: number;
        actionItems: number;
        copy: string;
    };
    collaboration: {
        slackSent: number;
        activeChannels: number;
        stakeholders: number;
        followUps: number;
        copy: string;
    };
    product: {
        decisions: number;
        features: number;
        releases: number;
        docs: number;
        copy: string;
    };
    focus: {
        busiestDay: string;
        leastProductiveDay: string;
        peakMeetingTime: string;
        zeroFocusDays: number;
        copy: string;
    };
    aiReflection: string;
}

export const lifeWrappedData: Record<'week' | 'month' | 'year', WrappedData> = {
    week: {
        period: 'This Week',
        timeOverview: {
            totalHours: 42,
            meetingHours: 14,
            meetingCount: 18,
            avgMeetingLengthMinutes: 45,
            focusPercentage: 66,
            copy: "You spent 14 hours in meetings this week."
        },
        meetingsBreakdown: {
            total: 18,
            oneOnOne: 4,
            team: 10,
            stakeholder: 4,
            longestMeeting: "Q1 Roadmap Review (2h)",
            shortestMeeting: "Daily Standup (15m)",
            insight: "Most of your meetings were internal syncs."
        },
        work: {
            completed: 9,
            created: 12,
            open: 5,
            actionItems: 7,
            copy: "You completed 9 tasks and created 12 new ones."
        },
        collaboration: {
            slackSent: 452,
            activeChannels: 8,
            stakeholders: 6,
            followUps: 3,
            copy: "You interacted with 6 stakeholders this week."
        },
        product: {
            decisions: 3,
            features: 2,
            releases: 1,
            docs: 4,
            copy: "3 product decisions moved work forward."
        },
        focus: {
            busiestDay: "Wednesday",
            leastProductiveDay: "Friday",
            peakMeetingTime: "2:00 PM",
            zeroFocusDays: 1,
            copy: "Wednesdays were your busiest meeting days."
        },
        aiReflection: "This week was collaboration-heavy. Most of your time went into alignment and planning, with steady execution progress. You may benefit from more focus blocks next week to tackle the upcoming roadmap items."
    },
    month: {
        period: 'This Month',
        timeOverview: {
            totalHours: 168,
            meetingHours: 52,
            meetingCount: 74,
            avgMeetingLengthMinutes: 42,
            focusPercentage: 69,
            copy: "You spent 52 hours in meetings this month."
        },
        meetingsBreakdown: {
            total: 74,
            oneOnOne: 12,
            team: 45,
            stakeholder: 17,
            longestMeeting: "All Hands (2.5h)",
            shortestMeeting: "Sync (10m)",
            insight: "Your meeting load decreased by 10% vs last month."
        },
        work: {
            completed: 45,
            created: 52,
            open: 12,
            actionItems: 28,
            copy: "You completed 45 tasks this month. Strong execution."
        },
        collaboration: {
            slackSent: 1890,
            activeChannels: 12,
            stakeholders: 14,
            followUps: 15,
            copy: "You were highly active in the #engineering channel."
        },
        product: {
            decisions: 12,
            features: 8,
            releases: 4,
            docs: 15,
            copy: "You shipped 4 releases. A very productive month."
        },
        focus: {
            busiestDay: "Tuesday",
            leastProductiveDay: "Monday",
            peakMeetingTime: "11:00 AM",
            zeroFocusDays: 3,
            copy: "Tuesdays consistently had the most interruptions."
        },
        aiReflection: "Overall, a high-impact month. You balanced a heavy meeting load with significant shipping velocity. Your focus time was well-protected in the second half of the month."
    },
    year: {
        period: 'This Year',
        timeOverview: {
            totalHours: 1840,
            meetingHours: 620,
            meetingCount: 840,
            avgMeetingLengthMinutes: 44,
            focusPercentage: 66,
            copy: "You spent 620 hours (~25 days) in meetings this year."
        },
        meetingsBreakdown: {
            total: 840,
            oneOnOne: 150,
            team: 500,
            stakeholder: 190,
            longestMeeting: "Strategy Offsite (6h)",
            shortestMeeting: "Quick Check (5m)",
            insight: "You attended 840 meetings in 2025."
        },
        work: {
            completed: 520,
            created: 600,
            open: 45,
            actionItems: 310,
            copy: "Over 500 tasks completed. Massive output."
        },
        collaboration: {
            slackSent: 24000,
            activeChannels: 25,
            stakeholders: 42,
            followUps: 150,
            copy: "You are a central communication hub for the team."
        },
        product: {
            decisions: 150,
            features: 85,
            releases: 40,
            docs: 120,
            copy: "You influenced 150 key product decisions."
        },
        focus: {
            busiestDay: "Wednesday",
            leastProductiveDay: "Friday",
            peakMeetingTime: "10:00 AM",
            zeroFocusDays: 15,
            copy: "Wednesdays were consistently your collaboration day."
        },
        aiReflection: "A defining year for your growth. You moved from pure execution to strategic alignment, as evidenced by the shift in meeting types and decision volume. Continue to guard your focus time as your influence grows."
    }
};
