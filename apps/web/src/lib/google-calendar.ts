export async function getCalendarEvents(accessToken: string) {
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
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google Calendar API Error:", response.status, errorText);
            throw new Error(`Google API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        return data.items.map((item: any) => ({
            id: item.id,
            title: item.summary || "No Title",
            startTime: item.start.dateTime || item.start.date,
            endTime: item.end.dateTime || item.end.date,
            link: item.htmlLink,
            status: item.status
        }));
    } catch (error) {
        console.error("getCalendarEvents Failed:", error);
        throw error;
    }
}
