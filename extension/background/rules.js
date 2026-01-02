// Domain categorization rules
export const CATEGORY_RULES = {
    communication: [
        'gmail.com', 'mail.google.com', 'outlook.com', 'slack.com',
        'discord.com', 'teams.microsoft.com', 'zoom.us', 'meet.google.com',
        'mail.yahoo.com', 'protonmail.com', 'telegram.org', 'whatsapp.com'
    ],
    building: [
        'github.com', 'gitlab.com', 'bitbucket.org', 'replit.com',
        'codesandbox.io', 'stackblitz.com', 'vercel.com', 'netlify.com',
        'figma.com', 'canva.com', 'vscode.dev', 'codepen.io'
    ],
    research: [
        'stackoverflow.com', 'reddit.com', 'news.ycombinator.com',
        'medium.com', 'dev.to', 'youtube.com', 'wikipedia.org',
        'google.com', 'bing.com', 'duckduckgo.com', 'perplexity.ai',
        'arxiv.org', 'scholar.google.com', 'researchgate.net'
    ],
    meetings: [
        'calendar.google.com', 'calendly.com', 'cal.com',
        'zoom.us/j', 'meet.google.com/j', 'teams.microsoft.com/l/meetup'
    ],
    admin: [
        'notion.so', 'trello.com', 'asana.com', 'monday.com',
        'airtable.com', 'clickup.com', 'linear.app', 'height.app',
        'drive.google.com', 'dropbox.com', 'docs.google.com'
    ]
};
/**
 * Categorize a domain based on matching rules
 */
export function categorizeDomain(domain) {
    const normalizedDomain = domain.toLowerCase();
    for (const [category, domains] of Object.entries(CATEGORY_RULES)) {
        if (domains.some(d => normalizedDomain.includes(d))) {
            return category;
        }
    }
    // Default category for uncategorized domains
    return 'research';
}
/**
 * Extract clean domain from URL
 */
export function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    }
    catch (_a) {
        return 'unknown';
    }
}
