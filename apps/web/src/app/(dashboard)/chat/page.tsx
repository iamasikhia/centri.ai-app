
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2, Plus, MessageCircle, Sparkles, Bot, Layout } from 'lucide-react';
import { ChatMessageRenderer } from '@/components/chat/chat-message-renderer';
import { UIResponse } from '@/types/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Artifact, Intent } from '@/types/chat';
import { MOCK_PRD_ARTIFACT, MOCK_ARCH_ARTIFACT } from '@/lib/mock-artifacts';
import { ArtifactPanel } from '@/components/chat/pr-pilot/artifact-panel';

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

    const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
    const [isArtifactVisible, setIsArtifactVisible] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Data Persistence ---
    useEffect(() => {
        const savedChats = localStorage.getItem('centri-chat-sessions-v3'); // Bumped version to reset for new empty state
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
        if (chatSessions.length > 0) localStorage.setItem('centri-chat-sessions-v3', JSON.stringify(chatSessions));
    }, [chatSessions]);

    const initializeDefaultChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [], // Start empty
            createdAt: new Date(), updatedAt: new Date()
        };
        setChatSessions([newSession]);
        setCurrentSessionId(newSession.id);
    };

    const createNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(), title: 'New Chat',
            messages: [], // Start empty
            createdAt: new Date(), updatedAt: new Date()
        };
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
    };

    const currentSession = chatSessions.find(s => s.id === currentSessionId);
    const messages = currentSession?.messages || [];

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isLoading || !currentSession) return;

        // 1. Add User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: new Date() };

        // Optimistic update
        setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg] } : s));

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
            let uiResponse: UIResponse;

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default-user-id'
                },
                body: JSON.stringify({ message: textToSend })
            });
            if (!res.ok) throw new Error('Failed to fetch response');
            uiResponse = await res.json();

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
                        // Update title if it's the first message interaction (default title is 'New Chat')
                        title: s.title === 'New Chat'
                            ? (uiResponse.sessionTitle || (textToSend.length > 30 ? textToSend.slice(0, 30) + '...' : textToSend))
                            : s.title
                    }
                    : s
            ));

            // Open Artifact Panel if present
            if (uiResponse.artifact) {
                setActiveArtifact(uiResponse.artifact);
                setIsArtifactVisible(true);
            }

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
        <div className="flex h-full w-full bg-background/50 relative overflow-hidden">
            {/* Main Chat Area - Resize when artifact is shown */}
            <div className={`flex h-full transition-all duration-500 ease-in-out ${isArtifactVisible ? 'w-full md:w-[45%]' : 'w-full'}`}>

                {/* Sidebar (History) - Moved to Left */}
                <div className={`w-72 border-r bg-card hidden xl:flex flex-col my-4 ml-4 rounded-xl border-y shrink-0 ${isArtifactVisible ? 'hidden 2xl:flex' : ''}`}>
                    <div className="p-4 border-b">
                        <button onClick={createNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 shadow-sm transition-all text-sm font-medium">
                            <Plus className="w-4 h-4" /> New Chat
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</div>
                        {chatSessions.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setCurrentSessionId(s.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-3 group relative",
                                    s.id === currentSessionId ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <MessageCircle className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100" />
                                <span className="truncate flex-1">{s.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Chat */}
                <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full h-[calc(100vh-2rem)] rounded-xl overflow-hidden border bg-background shadow-sm my-4 mx-4">

                    {/* Header (Mobile only basically, or context) */}
                    <div className="p-4 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold">{currentSession?.title || 'Chat'}</h2>
                        </div>
                        {activeArtifact && !isArtifactVisible && (
                            <button
                                onClick={() => setIsArtifactVisible(true)}
                                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full font-medium transition-colors"
                            >
                                <Sparkles className="w-3 h-3" /> View Artifact
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
                        {messages.length === 0 ? (
                            <EmptyChatState onSelect={(text) => handleSend(text)} />
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                                            msg.role === 'assistant' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'
                                        )}>
                                            {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <div className="text-xs font-bold">You</div>}
                                        </div>

                                        {/* Content */}
                                        <div className={cn(
                                            "flex flex-col max-w-[85%] w-full",
                                            msg.role === 'user' ? 'items-end' : 'items-start'
                                        )}>
                                            {msg.isThinking ? (
                                                <div className="w-full max-w-md space-y-3 py-1">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mb-2">
                                                        <Sparkles className="w-3 h-3" /> Centri is thinking...
                                                    </div>
                                                    <Skeleton className="h-4 w-3/4 bg-muted/50" />
                                                    <Skeleton className="h-4 w-1/2 bg-muted/50" />
                                                    <Skeleton className="h-32 w-full mt-3 rounded-lg bg-muted/30" />
                                                </div>
                                            ) : msg.role === 'user' ? (
                                                <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm shadow-sm">
                                                    {msg.content}
                                                </div>
                                            ) : (
                                                <div className="w-full">
                                                    {msg.uiResponse && <ChatMessageRenderer uiResponse={msg.uiResponse} />}
                                                    {msg.uiResponse?.artifact && (
                                                        <button
                                                            onClick={() => {
                                                                setActiveArtifact(msg.uiResponse!.artifact!);
                                                                setIsArtifactVisible(true);
                                                            }}
                                                            className="mt-3 text-xs flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground border rounded-lg transition-colors font-medium w-fit"
                                                        >
                                                            <Layout className="w-3.5 h-3.5" />
                                                            View {msg.uiResponse.artifact.type === 'prd' ? 'PRD' : 'Architecture'} Canvas
                                                        </button>
                                                    )}
                                                    {msg.content && (
                                                        <div className="bg-muted/30 border px-4 py-3 rounded-2xl rounded-tl-sm text-sm mt-1">
                                                            {msg.content}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
                        <div className="relative max-w-3xl mx-auto">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Ask Centri regarding your team, tasks, or schedule..."
                                className="w-full pl-4 pr-12 py-3.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none min-h-[52px] max-h-32"
                                disabled={isLoading}
                                rows={1}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "absolute right-2 bottom-2.5 p-2 rounded-lg transition-all",
                                    input.trim() && !isLoading
                                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                )}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-muted-foreground">Centri can make mistakes. Please verify important information.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Artifact Panel */}
            {isArtifactVisible && activeArtifact && (
                <ArtifactPanel
                    artifact={activeArtifact}
                    onClose={() => setIsArtifactVisible(false)}
                />
            )}
        </div>
    );
}

function EmptyChatState({ onSelect }: { onSelect: (text: string) => void }) {
    const suggestions = [
        { label: "Generate PRD", prompt: "Generate a PRD for a new AI Task Manager feature." },
        { label: "Design System Architecture", prompt: "Design the system architecture for a real-time sync engine." },
        { label: "Analyze Team Health", prompt: "Who on my team is blocked or overdue right now?" },
        { label: "Prepare for Meetings", prompt: "When is my next meeting and what do I need to prepare?" },
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
                <Bot className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-3 max-w-lg mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Hi, I'm Centri</h2>
                <p className="text-muted-foreground text-lg">
                    I'm your AI executive assistant. I can help you manage your team, schedule, and tasks. What would you like to handle today?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(s.prompt)}
                        className="flex flex-col items-start p-5 bg-card hover:bg-muted/50 border border-border hover:border-primary/50 rounded-xl transition-all text-left group shadow-sm hover:shadow-md"
                    >
                        <span className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">{s.label}</span>
                        <span className="text-xs text-muted-foreground/80 leading-relaxed">{s.prompt}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
