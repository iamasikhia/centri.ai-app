
"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import { Send, CheckCircle, Loader2 } from "lucide-react"

export default function ContactPage() {
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'success'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setStatus('success')
    }

    if (status === 'success') {
        return (
            <div className="max-w-md mx-auto pt-10">
                <Card className="text-center py-10">
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Message Sent!</h3>
                            <p className="text-muted-foreground">
                                Thanks for reaching out. We usually respond within 24 hours.
                            </p>
                        </div>
                        <Button onClick={() => setStatus('idle')} variant="outline" className="mt-4">
                            Send Another
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Give a Feedback</h2>
                <p className="text-muted-foreground">Have a question or feedback? We'd love to hear from you.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Send a Message</CardTitle>
                        <CardDescription>
                            We usually respond within 24 hours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" required placeholder="Jane Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" required placeholder="jane@example.com" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Message Type</Label>
                            <NativeSelect id="type">
                                <option value="support">Support Request</option>
                                <option value="feedback">Product Feedback</option>
                                <option value="feature">Feature Request</option>
                                <option value="bug">Bug Report</option>
                            </NativeSelect>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                required
                                placeholder="How can we help you?"
                                className="min-h-[150px]"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t p-6">
                        <p className="text-xs text-muted-foreground">
                            For urgent issues, please email support@centri.ai directly.
                        </p>
                        <Button type="submit" disabled={status === 'loading'}>
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
