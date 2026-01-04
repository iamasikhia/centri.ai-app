
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
        url.searchParams.append("timeMin", now.toISOString());
        url.searchParams.append("timeMax", oneWeekFromNow.toISOString());
        url.searchParams.append("maxResults", "50");
        url.searchParams.append("singleEvents", "true");
        url.searchParams.append("orderBy", "startTime");

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google Calendar API Error:", response.status, errorText);
            return NextResponse.json({ error: "Failed to fetch calendar events", details: errorText }, { status: response.status });
        }

        const data = await response.json();

        const events = data.items.map((item: any) => ({
            id: item.id,
            title: item.summary || "No Title",
            startTime: item.start.dateTime || item.start.date,
            endTime: item.end.dateTime || item.end.date,
            link: item.htmlLink,
            status: item.status
        }));

        return NextResponse.json({ events });
    } catch (error) {
        console.error("Calendar Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
