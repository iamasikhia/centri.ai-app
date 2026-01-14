'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BarChart, LineChart as LineChartIcon, PieChart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';

// --- Types ---
type MessageType = 'user' | 'ai';
type VisualizationType = 'line' | 'bar' | 'pie';

interface VisualizationData {
    type: VisualizationType;
    title: string;
    data: any[];
    dataKey?: string;
    categoryKey?: string;
}

interface Message {
    id: string;
    type: MessageType;
    content: string;
    timestamp: Date;
    visualization?: VisualizationData;
}

import { sendMessageToAI } from './actions';

// --- Visualization Templates ---
// (Removed dummy data templates as per user request to ensure accuracy)
// Future: Implement dynamic visualization data from AI response


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);
    const [messages, setMessages] = useState<Message[]>([]);

    // Set initial welcome message on client-side to avoid hydration mismatch (timestamp)
    useEffect(() => {
        setMessages([
            {
                id: 'welcome',
                type: 'ai',
                content: "Hello Admin. I'm connected to the Centri platform data via GPT-4o. I can help you visualize trends, analyze user behavior, or check system health. What would you like to know?",
                timestamp: new Date()
            }
        ]);
    }, []);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const originalInput = input;
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: originalInput,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Call the Real AI Backend
            const response = await sendMessageToAI(originalInput, conversationId);

            // Update conversation ID if provided
            if (response.conversationId) {
                setConversationId(response.conversationId);
            }

            let aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: response.answer,
                timestamp: new Date()
            };

            // (Visualization logic removed to prevent dummy data display)
            // The AI text response will contain the accurate data.


            setMessages(prev => [...prev, aiResponse]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'ai',
                content: "Sorry, I encountered an error. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Render visualization based on type
    const renderVisualization = (viz: VisualizationData) => {
        return (
            <div className="mt-4 p-4 border rounded-lg bg-card/50 w-full h-[300px]">
                <p className="text-sm font-semibold mb-4 text-center">{viz.title}</p>
                <ResponsiveContainer width="100%" height="85%">
                    {viz.type === 'line' ? (
                        <LineChart data={viz.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey={viz.categoryKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey={viz.dataKey!} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                    ) : viz.type === 'bar' ? (
                        <RechartsBarChart data={viz.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey={viz.categoryKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey={viz.dataKey!} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    ) : (
                        <RechartsPieChart>
                            <Pie
                                data={viz.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey={viz.dataKey!}
                            >
                                {viz.data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    )}
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="flex h-screen flex-col bg-background p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Performance Insights</h1>
                    <p className="text-muted-foreground">Ask questions about your platform data and generate visualizations</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setMessages([])}>
                        Clear Chat
                    </Button>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-sm">
                <CardContent className="flex-1 p-0 flex flex-col h-full">
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.type === 'ai' && (
                                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                                        <Bot className="h-4 w-4 text-primary" />
                                    </div>
                                )}

                                <div className={`flex flex-col max-w-[80%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-lg px-4 py-3 text-sm ${msg.type === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted/50 border'
                                            }`}
                                    >
                                        <p className="leading-relaxed">{msg.content}</p>
                                    </div>

                                    {/* Visualization Rendering */}
                                    {msg.visualization && (
                                        <div className="w-full mt-2 animate-in fade-in zoom-in duration-300">
                                            {renderVisualization(msg.visualization)}
                                        </div>
                                    )}

                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {msg.type === 'user' && (
                                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-accent border">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                                </div>
                                <div className="rounded-lg bg-muted px-4 py-3 text-sm">
                                    <div className="flex gap-1">
                                        <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
                        <div className="relative flex items-center max-w-4xl mx-auto">
                            <Input
                                placeholder="Ask about users, revenue, or integrations..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pr-12 h-12 text-base shadow-sm border-2 focus-visible:ring-primary/20"
                                autoFocus
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-1 top-1 h-10 w-10 transition-all hover:scale-105"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mt-2 text-center">
                            <p className="text-xs text-muted-foreground">
                                Try asking: <span className="font-mono bg-muted px-1 rounded">"Show me user growth"</span> or <span className="font-mono bg-muted px-1 rounded">"Analyze our revenue"</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
