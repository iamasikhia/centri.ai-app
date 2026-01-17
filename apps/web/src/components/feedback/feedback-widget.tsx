'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Bug, Lightbulb, Wrench, HelpCircle, Star, Check, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEEDBACK_TYPES = [
    { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
    { id: 'improvement', label: 'Improvement', icon: Wrench, color: 'text-blue-500' },
    { id: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-500' },
];

interface FeedbackWidgetProps {
    userEmail?: string;
    userName?: string;
}

export function FeedbackWidget({ userEmail, userName }: FeedbackWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<string>('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const handleSubmit = async () => {
        if (!type || !message.trim()) {
            setError('Please select a type and enter a message.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': userEmail || '',
                    'x-user-name': userName || '',
                },
                body: JSON.stringify({
                    type,
                    message,
                    rating: rating > 0 ? rating : undefined,
                    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to submit feedback');
            }

            setIsSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsSubmitted(false);
                setType('');
                setMessage('');
                setRating(0);
            }, 2000);
        } catch (e) {
            setError('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button - positioned below notifications icon */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-[6rem] right-6 z-50 p-3 rounded-full bg-white dark:bg-zinc-900 border text-muted-foreground hover:text-primary hover:border-primary/50 shadow-lg transition-all hover:scale-105 flex items-center justify-center group"
                title="Send Feedback"
            >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <Card className="shadow-2xl border-primary/20">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <MessageSquarePlus className="w-5 h-5 text-primary" />
                                            Send Feedback
                                        </CardTitle>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-1 rounded-full hover:bg-muted transition-colors"
                                        >
                                            <X className="w-5 h-5 text-muted-foreground" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Help us improve by sharing your thoughts.
                                    </p>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {isSubmitted ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center justify-center py-8 gap-4"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold">Thank you!</h3>
                                            <p className="text-muted-foreground text-center">
                                                Your feedback has been submitted successfully.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            {/* Type Selection */}
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-2 block">
                                                    Feedback Type
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {FEEDBACK_TYPES.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            onClick={() => setType(t.id)}
                                                            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${type === t.id
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:border-primary/40'
                                                                }`}
                                                        >
                                                            <t.icon className={`w-4 h-4 ${t.color}`} />
                                                            <span className="text-sm font-medium">{t.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-2 block">
                                                    Your Message
                                                </label>
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Tell us what's on your mind..."
                                                    className="w-full min-h-[120px] p-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                                                />
                                            </div>

                                            {/* Rating (Optional) */}
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-2 block">
                                                    How would you rate your experience? (Optional)
                                                </label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setRating(star)}
                                                            className="p-1 transition-transform hover:scale-110"
                                                        >
                                                            <Star
                                                                className={`w-6 h-6 transition-colors ${star <= rating
                                                                    ? 'text-amber-400 fill-amber-400'
                                                                    : 'text-muted-foreground/30'
                                                                    }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Error */}
                                            {error && (
                                                <p className="text-sm text-red-500">{error}</p>
                                            )}

                                            {/* Submit */}
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="w-full gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>Submitting...</>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Submit Feedback
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
