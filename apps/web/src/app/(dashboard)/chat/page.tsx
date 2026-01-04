
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2, Plus, MessageCircle } from 'lucide-react';
import { ChatMessageRenderer } from '@/components/chat/chat-message-renderer';
import { UIResponse } from '@/types/chat';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content?: string;
    timestamp: Date;
    uiResponse?: UIResponse;
    isThinking?: boolean;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

export default function ChatPage() {
    const { data: session } = useSession();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState('1');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Data Persistence ---
    useEffect(() => {
        const savedChats = localStorage.getItem('centri-chat-sessions-v2');
        if (savedChats) {
            try {
                const parsed = JSON.parse(savedChats);
                setChatSessions(parsed.map((chat: any) => ({
                    ...chat,
                    createdAt: new Date(chat.createdAt),
                    updatedAt: new Date(chat.updatedAt),
                    messages: chat.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                })));
                if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
                else initializeDefaultChat();
            } catch (e) { initializeDefaultChat(); }
        } else {
            initializeDefaultChat();
        }
    }, []);

    useEffect(() => {
        if (chatSessions.length > 0) localStorage.setItem('centri-chat-sessions-v2', JSON.stringify(chatSessions));
    }, [chatSessions]);

    const initializeDefaultChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [{
                id: Date.now().toString(),
                role: 'assistant',
                content: "Hi! I'm Centri. Ask me \"Who are my team members?\" or \"When is my next meeting?\".",
                timestamp: new Date()
            }],
            createdAt: new Date(), updatedAt: new Date()
        };
        setChatSessions([newSession]);
        setCurrentSessionId(newSession.id);
    };

    const createNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(), title: 'New Chat',
            messages: [{ id: Date.now().toString(), role: 'assistant', content: "Hi! I'm Centri. What can I help you with?", timestamp: new Date() }],
            createdAt: new Date(), updatedAt: new Date()
        };
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
    };

    const currentSession = chatSessions.find(s => s.id === currentSessionId);
    const messages = currentSession?.messages || [];

    const handleSend = async () => {
        if (!input.trim() || isLoading || !currentSession) return;

        // 1. Add User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };

        // Optimistic update
        setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

        const currentInput = input;
        setInput('');
        setIsLoading(true);

        // 2. Add "Thinking" Message
        const tempId = (Date.now() + 1).toString();
        const thinkingMsg: Message = {
            id: tempId,
            role: 'assistant',
            isThinking: true,
            timestamp: new Date()
        };

        setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, thinkingMsg] } : s));

        try {
            // CALL BACKEND
            const res = await fetch('http://localhost:3001/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id'
                },
                body: JSON.stringify({ message: currentInput })
            });

            if (!res.ok) throw new Error('Failed to fetch response');

            const uiResponse: UIResponse = await res.json();

            // 3. Update with Real Response
            const finalMsg: Message = {
                id: tempId,
                role: 'assistant',
                uiResponse: uiResponse,
                timestamp: new Date()
            };

            setChatSessions(prev => prev.map(s =>
                s.id === currentSessionId
                    ? {
                        ...s,
                        messages: s.messages.map(m => m.id === tempId ? finalMsg : m),
                        title: s.messages.length <= 1 ? (currentInput.length > 20 ? currentInput.slice(0, 20) + '...' : currentInput) : s.title
                    }
                    : s
            ));

        } catch (e) {
            console.error(e);
            // Error State
            const errorMsg: Message = {
                id: tempId,
                role: 'assistant',
                content: "Sorry, I encountered an error connecting to the server.",
                timestamp: new Date()
            };
            setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages.filter(m => m.id !== tempId), errorMsg] } : s));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full bg-background">
            {/* Main Chat */}
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {msg.role === 'assistant' ? <span className="text-xs font-bold">AI</span> : <span className="text-xs">You</span>}
                            </div>

                            {/* Content */}
                            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
                                {msg.isThinking ? (
                                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Centri is thinking...</span>
                                    </div>
                                ) : msg.role === 'user' ? (
                                    <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        {msg.content && <p className="text-sm text-muted-foreground mb-2">{msg.content}</p>}
                                        {msg.uiResponse && <ChatMessageRenderer uiResponse={msg.uiResponse} />}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything..."
                            className="w-full pl-4 pr-12 py-3 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-2 p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar (History) */}
            <div className="w-64 border-l bg-muted/10 flex flex-col hidden md:flex">
                <div className="p-4">
                    <button onClick={createNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 shadow-sm transition-all">
                        <Plus className="w-4 h-4" /> New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 space-y-1">
                    {chatSessions.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentSessionId(s.id)}
                            className={`w-full text-left px-3 py-3 rounded-md text-sm transition-colors flex items-center gap-3 ${s.id === currentSessionId ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50 text-muted-foreground'}`}
                        >
                            <MessageCircle className="w-4 h-4 shrink-0" />
                            <span className="truncate">{s.title}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
