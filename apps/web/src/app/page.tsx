"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground px-4">
            <div className="w-full max-w-[420px] mx-auto space-y-8">
                {/* Logo and Branding */}
                <div className="flex flex-col space-y-4 text-center items-center">
                    <div className="relative">
                        <Image
                            src="/logo.png"
                            alt="Centri.ai"
                            width={80}
                            height={80}
                            className="rounded-2xl shadow-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">Centri.ai</h1>
                        <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            The minimal dashboard for high-output managers.
                        </p>
                    </div>
                </div>

                {/* Value Props */}
                <div className="grid gap-3 text-sm">
                    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                            <div className="font-medium mb-1">Pre-meeting intelligence</div>
                            <div className="text-muted-foreground text-xs">See who you're meeting and what they're working on</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                            <div className="font-medium mb-1">Team health at a glance</div>
                            <div className="text-muted-foreground text-xs">Track blockers, overdue tasks, and dependencies</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div>
                            <div className="font-medium mb-1">Read-only & privacy-first</div>
                            <div className="text-muted-foreground text-xs">No surveillance, no tracking—just the context you need</div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="space-y-4">
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        className="w-full inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-11 px-8"
                    >
                        Sign In with Google
                    </button>

                    <p className="text-center text-xs text-muted-foreground leading-relaxed">
                        By continuing, you agree to our{' '}
                        <a href="#" className="underline underline-offset-4 hover:text-foreground">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>
                    </p>
                </div>

                {/* Footer Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>All systems operational</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
