'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from './chat-provider';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from '@/components/ui/sheet';
import {
    Send, Loader2, Sparkles, Bot, User,
    Calendar, MessageSquare, Github, FileText, Video,
    ThumbsUp, ThumbsDown, Copy, Check, ArrowRight,
    HelpCircle, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

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
    content: string;
    data?: ChatResponse;
    timestamp: Date;
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

export function FloatingChat() {
    const pathname = usePathname();
    const { isOpen, setIsOpen } = useChat(); // Use global context
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, isOpen]);


    // Determine Context
    const getContext = () => {
        if (pathname.includes('/dashboard')) return 'Dashboard Overview';
        if (pathname.includes('/meetings')) return 'Meetings & Transcripts';
        if (pathname.includes('/chat')) return 'Chat & History';
        if (pathname.includes('/settings')) return 'Settings & Integrations';
        return 'General Assistant';
    };

    const context = getContext();

    const handleClear = () => {
        setMessages([]);
    };

    const handleSend = async (textOverride?: string) => {
        const text = textOverride || input;
        if (!text.trim() || isLoading) return;

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

            // Construct a prompt that includes context
            // Note: The backend likely expects 'message', we can prepend context
            const messageWithContext = `[Context: ${context}] ${text}`;

            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user-id' },
                body: JSON.stringify({
                    message: messageWithContext,
                    conversationId: 'floating-chat-' + pathname // Simple ephemeral session per page/path
                })
            });

            if (!res.ok) throw new Error('Failed to fetch');

            const data: any = await res.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer,
                data: data,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again.",
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
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 hover:scale-105 transition-all duration-200"
                >
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium pr-1">Ask Centri</span>
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 h-full">
                <SheetHeader className="px-6 py-4 border-b bg-muted/10">
                    <div className="flex items-center justify-between w-full">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span>Centri Assistant</span>
                                <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {context}
                                </span>
                            </div>
                        </SheetTitle>
                        {messages.length > 0 && (
                            <button
                                onClick={handleClear}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                title="Clear chat"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <SheetDescription className="sr-only">
                        AI Assistant for {context}
                    </SheetDescription>
                </SheetHeader>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-4 opacity-100">
                            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-2">
                                <Sparkles className="w-8 h-8 text-violet-500/50" />
                            </div>
                            <h3 className="font-semibold text-lg">How can I help with {context}?</h3>
                            <p className="text-sm text-muted-foreground">
                                I can answer questions about content on this page or your general data.
                            </p>
                            <div className="grid gap-2 w-full pt-4">
                                <button onClick={() => handleSend("What can I do here?")} className="text-xs p-3 bg-muted/50 hover:bg-muted rounded-lg text-left transition-colors">
                                    "What can I do here?"
                                </button>
                                <button onClick={() => handleSend("Summarize the key info.")} className="text-xs p-3 bg-muted/50 hover:bg-muted rounded-lg text-left transition-colors">
                                    "Summarize the key info."
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} onSend={handleSend} />
                        ))
                    )}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                                <Sparkles className="w-3 h-3" />
                            </div>
                            <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background mt-auto">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask about ${context}...`}
                            className="w-full pl-4 pr-12 py-3 bg-muted/50 border-transparent focus:bg-background border focus:border-violet-500/50 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/10 transition-all outline-none resize-none min-h-[50px] max-h-32"
                            rows={1}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "absolute right-2 bottom-2 p-1.5 rounded-lg transition-all",
                                input.trim() ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-transparent text-muted-foreground/30 cursor-not-allowed"
                            )}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-2 opacity-70">
                        Context: {context}
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ChatMessage({ message, onSend }: { message: Message, onSend: (t: string) => void }) {
    const isAi = message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-3 max-w-full", !isAi && "ml-auto flex-row-reverse")}
        >
            <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-[10px]",
                isAi ? "bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600"
            )}>
                {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>

            <div className={cn("flex flex-col gap-1 min-w-0 max-w-[85%]", !isAi && "items-end")}>
                <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                    isAi
                        ? "bg-white dark:bg-zinc-900 border rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                )}>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:marker:text-primary prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                </div>

                {isAi && message.data && (
                    <div className="space-y-3 pt-1 w-full">
                        {/* Citations */}
                        {message.data.citations && message.data.citations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {message.data.citations.map((c, i) => {
                                    const Icon = SourceIcons[c.source] || Check;
                                    return (
                                        <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 border rounded-full text-[10px] font-medium text-muted-foreground">
                                            <Icon className="w-3 h-3" />
                                            {c.source}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Follow Ups */}
                        {message.data.followUps && message.data.followUps.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                                {message.data.followUps.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onSend(q)}
                                        className="text-xs text-left px-3 py-1.5 bg-violet-50 dark:bg-violet-900/10 hover:bg-violet-100 dark:hover:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg transition-colors"
                                    >
                                        "{q}"
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
