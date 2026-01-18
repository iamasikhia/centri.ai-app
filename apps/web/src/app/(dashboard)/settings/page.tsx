
"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Moon, Sun, Monitor, Upload, LogOut, Trash2, CreditCard, Crown, ArrowRight, Sparkles } from "lucide-react"
import { PricingModal } from "@/components/pricing-modal"

export default function SettingsPage() {
    const { data: session } = useSession()
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const [mounted, setMounted] = React.useState(false)
    const [showPricingModal, setShowPricingModal] = React.useState(false)
    const [chatModel, setChatModel] = React.useState<'openai' | 'claude'>('openai')
    const [savingModel, setSavingModel] = React.useState(false)

    // Form states
    const [name, setName] = React.useState("")
    const [timezone, setTimezone] = React.useState("UTC")

    React.useEffect(() => {
        setMounted(true)
        if (session?.user?.name) setName(session.user.name)
    }, [session])

    React.useEffect(() => {
        if (mounted && session) {
            fetchChatModel()
        }
    }, [mounted, session])

    const fetchChatModel = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            const userId = session?.user?.email || 'default-user-id'
            const res = await fetch(`${API_URL}/chat-settings/model`, {
                headers: { 'x-user-id': userId }
            })
            if (res.ok) {
                const data = await res.json()
                setChatModel(data.model || 'openai')
            }
        } catch (e) {
            console.error('Failed to fetch chat model:', e)
        }
    }

    const handleModelChange = async (model: string) => {
        setSavingModel(true)
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
            const userId = session?.user?.email || 'default-user-id'
            const res = await fetch(`${API_URL}/chat-settings/model`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify({ model })
            })
            if (res.ok) {
                setChatModel(model as 'openai' | 'claude')
            } else {
                console.error('Failed to update chat model')
                alert('Failed to update chat model. Please try again.')
            }
        } catch (e) {
            console.error('Failed to update chat model:', e)
            alert('Failed to update chat model. Please try again.')
        } finally {
            setSavingModel(false)
        }
    }

    if (!mounted) return <SettingsSkeleton />

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your profile, appearance, and application preferences.</p>
            </div>

            {/* Billing & Subscription */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-primary" />
                        Billing & Subscription
                    </CardTitle>
                    <CardDescription>Manage your subscription plan and payment methods.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <CreditCard className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Current Plan: <span className="text-primary">Free</span></p>
                                <p className="text-sm text-muted-foreground">Upgrade to unlock all features</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowPricingModal(true)}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Upgrade
                            </Button>
                            <Button variant="ghost" onClick={() => router.push('/settings/billing')}>
                                Manage
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <ThemeCard
                                active={theme === 'light'}
                                onClick={() => setTheme('light')}
                                icon={<Sun className="w-5 h-5" />}
                                label="Light"
                            />
                            <ThemeCard
                                active={theme === 'dark'}
                                onClick={() => setTheme('dark')}
                                icon={<Moon className="w-5 h-5" />}
                                label="Dark"
                            />
                            <ThemeCard
                                active={theme === 'system'}
                                onClick={() => setTheme('system')}
                                icon={<Monitor className="w-5 h-5" />}
                                label="System"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            System follows your device’s appearance settings.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your public profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer">
                            <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <span className="text-xs font-medium">Change</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-medium">Profile Picture</h4>
                            <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max 1MB.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={session?.user?.email || ''} disabled className="bg-muted" />
                        </div>
                    </div>

                    <div className="space-y-2 max-w-sm">
                        <Label htmlFor="timezone">Timezone</Label>
                        <NativeSelect id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                            <option value="UTC">UTC (Universal Time Coordinated)</option>
                            <option value="EST">EST (Eastern Standard Time)</option>
                            <option value="PST">PST (Pacific Standard Time)</option>
                            <option value="CET">CET (Central European Time)</option>
                        </NativeSelect>
                    </div>
                </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize how the AI interacts with you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 max-w-sm">
                        <Label htmlFor="chat-model">AI Chat Model</Label>
                        <p className="text-sm text-muted-foreground">Choose which AI model to use for Centri assistant chat.</p>
                        <NativeSelect
                            id="chat-model"
                            value={chatModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            disabled={savingModel}
                        >
                            <option value="openai">OpenAI (GPT-4o)</option>
                            <option value="claude">Claude (Sonnet 3.5)</option>
                        </NativeSelect>
                        {savingModel && (
                            <p className="text-xs text-muted-foreground">Saving...</p>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>AI Summaries</Label>
                            <p className="text-sm text-muted-foreground">Automatically summarize long updates.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Separate Tasks & Meetings</Label>
                            <p className="text-sm text-muted-foreground">Keep calendar tasks separate from meetings.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Urgent Updates Only</Label>
                            <p className="text-sm text-muted-foreground">Hide info-level updates from the main feed.</p>
                        </div>
                        <Switch />
                    </div>

                    <div className="space-y-2 max-w-sm pt-2">
                        <Label htmlFor="summary-depth">Summary Depth</Label>
                        <NativeSelect id="summary-depth">
                            <option value="short">Short (Bullet points)</option>
                            <option value="standard">Standard (Paragraphs)</option>
                            <option value="detailed">Detailed (Full context)</option>
                        </NativeSelect>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>In-App Notifications</Label>
                            <p className="text-sm text-muted-foreground">Show badges and toasts.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive updates via email.</p>
                        </div>
                        <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Daily Digest</Label>
                            <p className="text-sm text-muted-foreground">Receive a morning summary at 9 AM.</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>

            {/* Privacy Section */}
            <Card className="border-red-100 dark:border-red-900/30">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-500">Privacy & Data</CardTitle>
                    <CardDescription>Manage your data and session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Stored Data
                        </Button>
                        <Button variant="secondary" onClick={() => {
                            localStorage.removeItem('onboarding_complete');
                            localStorage.removeItem('user_goals');
                            localStorage.removeItem('selected_integrations');
                            signOut({ callbackUrl: '/' });
                        }}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <PricingModal
                open={showPricingModal}
                onOpenChange={setShowPricingModal}
            />
        </div>
    )
}

function ThemeCard({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all w-28
                ${active
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted bg-card hover:border-primary/50 text-muted-foreground'
                }
            `}
        >
            <div className={`p-2 rounded-full ${active ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
        </button>
    )
}

function SettingsSkeleton() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-48 mb-6" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    )
}
