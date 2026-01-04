
export type MeetingInfo = {
    location?: string | null;
    description?: string | null;
    meetLink?: string | null;
    htmlLink?: string | null;
};

export type PhysicalAnswer = {
    answer: "YES" | "NO" | "UNKNOWN";
    confidence: "high" | "medium" | "low";
    reason: string;
    evidence: { label: string; value: string }[];
};

export function isPhysicalMeeting(meeting: MeetingInfo): PhysicalAnswer {
    const evidence: { label: string; value: string }[] = [];

    // A) Join Link exists
    const hasJoinLink = !!meeting.meetLink || (meeting.description && /zoom|meet\.google|teams\.microsoft|webex/.test(meeting.description));
    if (meeting.meetLink) evidence.push({ label: "Join Link", value: meeting.meetLink });

    // B) Location keywords for virtual
    const location = meeting.location || "";
    const virtualKeywords = ["zoom", "google meet", "meet.google.com", "teams", "microsoft teams", "webex", "http", "https", "dial-in", "phone", "virtual", "remote"];
    const isVirtualLocation = virtualKeywords.some(k => location.toLowerCase().includes(k));

    if (isVirtualLocation) evidence.push({ label: "Location indicates virtual", value: location });

    // C) Physical keywords
    const physicalKeywords = ["Room", "Rm", "Building", "Hall", "Suite", "Floor", "Auditorium", "Campus", "Office", "HQ", "Conference"];
    // Also check for street address patterns like "123 Main St" (starts with digits, contains 'St', 'Ave', 'Rd', 'Blvd')
    const addressPattern = /\d+\s+[A-Za-z0-9]+\s+(St|Ave|Rd|Blvd|Dr|Lane|Way|Pl|Square)/i;

    const isPhysicalLocation = physicalKeywords.some(k => location.includes(k)) || addressPattern.test(location);
    if (isPhysicalLocation) evidence.push({ label: "Physical Location", value: location });

    // DECISION LOGIC

    // A & B overlap: if explicitly virtual (link or location keyword), assume NO.
    if (isVirtualLocation || (hasJoinLink && !isPhysicalLocation)) {
        return {
            answer: "NO",
            confidence: "high",
            reason: isVirtualLocation ? "Location explicitly indicates a virtual meeting." : "Meeting has a video link and no physical location.",
            evidence
        };
    }

    // C) Physical Location confirmed
    if (isPhysicalLocation && !hasJoinLink) {
        return {
            answer: "YES",
            confidence: "high",
            reason: "Location indicates a physical room or address.",
            evidence
        };
    }

    // D) Hybrid (Physical AND Link)
    if (isPhysicalLocation && hasJoinLink) {
        return {
            answer: "UNKNOWN",
            confidence: "medium",
            reason: "Both a physical location and a video link are present; could be hybrid.",
            evidence
        };
    }

    // E) No info
    return {
        answer: "UNKNOWN",
        confidence: "low",
        reason: "No location or video link found in calendar event details.",
        evidence
    };
}
