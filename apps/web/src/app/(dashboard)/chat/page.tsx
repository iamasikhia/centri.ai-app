'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSubscription } from '@/contexts/subscription-context';
import { hasFeature } from '@/lib/subscription';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';
import {
    Send, Loader2, Sparkles, Bot, User,
    Calendar, MessageSquare, Github, FileText, Video,
    ThumbsUp, ThumbsDown, Copy, Check, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface ChatResponse {
    answer: string;
    citations?: Array<{ source: string; type: string; count?: number; link?: string }>;
    insights?: string[];
    actions?: Array<{ label: string; type: string; uri?: string }>;
    followUps?: string[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string; // User content or Assistant 'answer'
    data?: ChatResponse; // Full structured data for assistant
    timestamp: Date;
    isThinking?: boolean;
}

// --- Icons Map ---
const SourceIcons: Record<string, any> = {
    'Google Calendar': Calendar,
    'Slack': MessageSquare,
    'GitHub': Github,
    'Google Drive': FileText,
    'Notion': FileText,
    'Zoom': Video,
    'Google Meet': Video,
    'Fathom': Video,
};

export default function ChatPage() {
    const { data: session } = useSession();
    const { tier } = useSubscription();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Fetch History List
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/chat/history`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error('Failed to fetch history', e);
        }
    };

    // Fetch Conversation Details
    const loadConversation = async (id: string) => {
        setConversationId(id);
        setMessages([]); // Clear current view
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/chat/history/${id}`, {
                headers: { 'x-user-id': 'default-user-id' }
            });
            if (res.ok) {
                const data = await res.json();
                // Map DB messages to UI messages
                const mappedMessages = data.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    data: m.data,
                    timestamp: new Date(m.createdAt)
                }));
                setMessages(mappedMessages);
            }
        } catch (e) {
            console.error('Failed to load conversation', e);
        }
    };

    const handleNewChat = () => {
        setConversationId(null);
        setMessages([]);
    };

    const handleSend = async (textOverride?: string) => {
        const text = textOverride || input;
        if (!text.trim() || isLoading) return;

        // 1. Add User Message (Optimistic)
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user-id' },
                body: JSON.stringify({
                    message: text,
                    conversationId: conversationId
                })
            });

            if (!res.ok) throw new Error('Failed to fetch');

            const data: any = await res.json();

            // 3. Add Assistant Message
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer,
                data: data,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);

            // If this was a new conversation, set the ID and refresh history to show title
            if (!conversationId && data.conversationId) {
                setConversationId(data.conversationId);
                setTimeout(fetchHistory, 2000); // Wait for title generation
            }

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting to my brain right now. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full w-full bg-background relative overflow-hidden flex-col md:flex-row">

            {/* Left Sidebar (History) */}
            <div className="hidden md:flex flex-col w-64 border-r bg-muted/10 p-4 gap-4">
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all shadow-sm"
                >
                    <Sparkles className="w-4 h-4" /> New Chat
                </button>

                <div className="flex-1 overflow-y-auto space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Recent</p>
                    {history.length === 0 && <p className="px-3 text-sm text-muted-foreground/50 italic">No history yet</p>}

                    {history.map((conv: any) => (
                        <div
                            key={conv.id}
                            onClick={() => loadConversation(conv.id)}
                            className={cn(
                                "truncate px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors",
                                conversationId === conv.id
                                    ? "bg-muted font-medium text-foreground"
                                    : "text-foreground/80 hover:bg-muted/50"
                            )}
                        >
                            {conv.title || 'New Conversation'}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">

                {/* Header */}
                <header className="h-14 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-sm">Centri Co-Pilot</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-muted-foreground">GPT-4o • 10 Integrations Active</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                    {messages.length === 0 ? (
                        <EmptyState onSelect={handleSend} />
                    ) : (
                        messages.map((msg, i) => (
                            <ChatMessage key={msg.id} message={msg} onSend={handleSend} />
                        ))
                    )}

                    {isLoading && (
                        <div className="flex gap-4 max-w-3xl">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0 mt-1">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                                    <Sparkles className="w-3 h-3" /> Thinking...
                                </div>
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 border-t bg-background">
                    <div className="max-w-3xl mx-auto relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about meetings, GitHub PRs, Slack messages..."
                            className="w-full pl-5 pr-14 py-4 bg-muted/40 border-muted-foreground/20 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none resize-none min-h-[60px] max-h-40 shadow-sm"
                            rows={1}
                            style={{ minHeight: '60px' }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "absolute right-3 bottom-3 p-2 rounded-xl transition-all",
                                input.trim() ? "bg-violet-600 text-white hover:bg-violet-700 shadow-md" : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-3">
                        Centri can verify data across Google, Slack, and GitHub. Always check specific sources.
                    </p>
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function EmptyState({ onSelect }: { onSelect: (t: string) => void }) {
    const suggestions = [
        { icon: Calendar, label: "What meetings do I have today?", delay: 0 },
        { icon: MessageSquare, label: "Summarize recent Slack updates", delay: 0.1 },
        { icon: Github, label: "Show open PRs for the backend", delay: 0.2 },
        { icon: Video, label: "Find recordings from yesterday", delay: 0.3 },
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-10 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-xl mb-6 mx-auto rotate-3">
                    <Bot className="w-12 h-12" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-background border px-3 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Online
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">How can I help you today?</h2>
                <p className="text-muted-foreground text-lg">
                    I have access to your calendar, code, and communications.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full px-4">
                {suggestions.map((s, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: s.delay }}
                        onClick={() => onSelect(s.label)}
                        className="flex items-center gap-4 p-4 text-left bg-card hover:bg-muted/50 border hover:border-violet-500/30 rounded-xl transition-all group shadow-sm hover:shadow-md"
                    >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
                            <s.icon className="w-5 h-5 text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400" />
                        </div>
                        <span className="font-medium text-sm text-foreground/80 group-hover:text-foreground">{s.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

function ChatMessage({ message, onSend }: { message: Message, onSend: (t: string) => void }) {
    const isAi = message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-4 md:gap-6 max-w-4xl", !isAi && "ml-auto flex-row-reverse")}
        >
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                isAi ? "bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white" : "bg-muted border"
            )}>
                {isAi ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4 text-muted-foreground" />}
            </div>

            {/* Bubble */}
            <div className={cn("flex flex-col gap-2 min-w-0", !isAi && "items-end")}>

                {/* Content */}
                <div className={cn(
                    "px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-none break-words",
                    isAi
                        ? "bg-card border w-full rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none max-w-lg"
                )}>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-stone-900 prose-pre:p-0">
                        <ReactMarkdown
                            components={{
                                // Custom Link styling for citations if standard MD links used
                                a: ({ node, ...props }) => <a {...props} className="text-violet-600 hover:underline font-medium" target="_blank" />
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* AI Extras: Citations, Insights, Actions */}
                {isAi && message.data && (
                    <div className="space-y-4 w-full animate-in fade-in pl-1">

                        {/* Citations */}
                        {message.data.citations && message.data.citations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {message.data.citations.map((c, i) => {
                                    const Icon = SourceIcons[c.source] || Check;
                                    return (
                                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 border rounded-full text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-default">
                                            <Icon className="w-3 h-3" />
                                            {c.source}
                                            {c.count && c.count > 1 && <span className="bg-background px-1.5 rounded-full text-[10px] border shadow-sm">{c.count}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Insights */}
                        {message.data.insights && message.data.insights.length > 0 && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-xs uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5" /> Proactive Insights
                                </div>
                                <ul className="space-y-2">
                                    {message.data.insights.map((insight, i) => (
                                        <li key={i} className="text-sm flex gap-2 text-foreground/90">
                                            <span className="text-emerald-500">•</span> {insight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Actions */}
                        {message.data.actions && message.data.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {message.data.actions.map((action, i) => (
                                    <button
                                        key={i}
                                        className="flex items-center gap-2 px-4 py-2 bg-background border border-border hover:border-violet-500/50 hover:bg-violet-50 dark:hover:bg-violet-900/10 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
                                        onClick={() => window.open(action.uri || '#', '_blank')}
                                    >
                                        {action.label}
                                        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Follow Ups */}
                        {message.data.followUps && message.data.followUps.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {message.data.followUps.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onSend(q)}
                                        className="text-xs px-3 py-1.5 bg-muted hover:bg-violet-100 dark:hover:bg-violet-900/20 text-muted-foreground hover:text-violet-700 dark:hover:text-violet-300 rounded-full transition-colors border border-transparent hover:border-violet-200"
                                    >
                                        "{q}"
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Feedback Actions */}
                        <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
