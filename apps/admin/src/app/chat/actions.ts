'use server';

export interface ChatResponse {
    answer: string;
    citations?: any[];
    insights?: string[];
    actions?: any[];
    followUps?: string[];
    conversationId?: string;
}

export async function sendMessageToAI(message: string, conversationId?: string): Promise<ChatResponse> {
    try {
        const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'admin-user' // Hardcoded for admin context
            },
            body: JSON.stringify({
                message,
                conversationId
            }),
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error('[ChatAction] Backend error:', response.status, await response.text());
            throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[ChatAction] Failed to send message:', error);
        return {
            answer: "I'm having trouble connecting to the AI brain right now. Please ensure the backend API is running.",
            conversationId
        };
    }
}
