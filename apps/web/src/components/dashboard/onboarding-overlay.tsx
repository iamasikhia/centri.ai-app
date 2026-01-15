'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingOverlayProps {
    onComplete: () => void;
    onConnectGithub: () => Promise<void>;
    onConnectCalendar: () => Promise<void>;
}

type Step = 'welcome' | 'goals' | 'integrations';

interface Goal {
    id: string;
    statement: string;
    icon: string;
}

interface Integration {
    id: string;
    name: string;
    description: string;
    logo: string;
    darkInvert?: boolean;
}

const GOALS: Goal[] = [
    {
        id: 'engineering-tracking',
        statement: 'I want to keep track of what is going on with my Engineering team',
        icon: '👨‍💻'
    },
    {
        id: 'slack-checkins',
        statement: 'I want to run check-ins with my team on Slack',
        icon: '💬'
    },
    {
        id: 'meeting-prep',
        statement: 'I want to get prepped for technical meetings',
        icon: '📅'
    },
    {
        id: 'codebase-understanding',
        statement: 'I want to understand the codebase',
        icon: '🧠'
    },
    {
        id: 'stakeholder-updates',
        statement: 'I want to provide stakeholder updates without chasing people',
        icon: '📊'
    },
    {
        id: 'decision-tracking',
        statement: 'I want to track decisions made across meetings',
        icon: '✅'
    },
];

const INTEGRATIONS: Integration[] = [
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Fetch meetings and user info.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg'
    },
    {
        id: 'gmail',
        name: 'Gmail',
        description: 'Fetch recent emails as updates.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg'
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Discover team members.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg'
    },
    {
        id: 'github',
        name: 'GitHub',
        description: 'Track merged PRs to main/product.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
        darkInvert: true
    },
    {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Search and organize files.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg'
    },
    {
        id: 'google-docs',
        name: 'Google Docs',
        description: 'Create and edit documents.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg'
    },
    {
        id: 'notion',
        name: 'Notion',
        description: 'All-in-one workspace.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg',
        darkInvert: true
    },
    {
        id: 'zoom',
        name: 'Zoom',
        description: 'Video conferencing.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Zoom_Logo_2022.svg'
    },
    {
        id: 'google-meet',
        name: 'Google Meet',
        description: 'Video conferencing.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg'
    },
    {
        id: 'fathom',
        name: 'Fathom',
        description: 'AI Meeting Recorder.',
        logo: 'https://fathom.video/images/brand/icon.svg'
    },
];

export function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>('welcome');
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);

    const toggleGoal = (id: string) => {
        setSelectedGoals(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const toggleIntegration = (id: string) => {
        setSelectedIntegrations(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleFinish = () => {
        // Save selections to localStorage for personalization
        localStorage.setItem('user_goals', JSON.stringify(selectedGoals));
        localStorage.setItem('selected_integrations', JSON.stringify(selectedIntegrations));
        // Mark onboarding as complete BEFORE redirect
        localStorage.setItem('onboarding_complete', 'true');
        onComplete();
        // Redirect to integrations page to do actual connections
        router.push('/settings/integrations');
    };

    return (
        <div className="fixed inset-0 z-[999] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-4xl w-full py-8">
                    <AnimatePresence mode="wait">

                        {/* STEP 1: WELCOME */}
                        {step === 'welcome' && (
                            <motion.div
                                key="welcome"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.4 }}
                                className="text-center space-y-8"
                            >
                                <div className="mx-auto w-24 h-24 mb-4">
                                    <Image
                                        src="/logo.png"
                                        alt="Centri Logo"
                                        width={96}
                                        height={96}
                                        className="rounded-2xl shadow-2xl"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                        Welcome to Centri
                                    </h1>
                                    <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
                                        Your Meeting Intelligence AI. Let's personalize your experience.
                                    </p>
                                </div>

                                <Button
                                    size="lg"
                                    className="text-lg h-14 px-10 gap-3 shadow-lg hover:shadow-primary/20 transition-all"
                                    onClick={() => setStep('goals')}
                                >
                                    Get Started
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        )}

                        {/* STEP 2: GOALS / INTENT SELECTION */}
                        {step === 'goals' && (
                            <motion.div
                                key="goals"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-3">
                                    <div className="mx-auto w-16 h-16 mb-2">
                                        <Image
                                            src="/logo.png"
                                            alt="Centri Logo"
                                            width={64}
                                            height={64}
                                            className="rounded-xl shadow-lg"
                                        />
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                        What brings you to Centri?
                                    </h1>
                                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
                                        Select all that apply. This helps us tailor your experience.
                                    </p>
                                </div>

                                {/* Goals Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                                    {GOALS.map((goal, index) => {
                                        const isSelected = selectedGoals.includes(goal.id);
                                        return (
                                            <motion.button
                                                key={goal.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.08 }}
                                                onClick={() => toggleGoal(goal.id)}
                                                className={`
                                                    relative group flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left
                                                    ${isSelected
                                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-lg shadow-violet-500/10'
                                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md'
                                                    }
                                                `}
                                            >
                                                {/* Selection Indicator */}
                                                <div className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200
                                                    ${isSelected
                                                        ? 'border-violet-500 bg-violet-500'
                                                        : 'border-zinc-300 dark:border-zinc-600 group-hover:border-violet-400'
                                                    }
                                                `}>
                                                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                                </div>

                                                {/* Icon & Text */}
                                                <div className="flex-1">
                                                    <span className="text-2xl mb-2 block">{goal.icon}</span>
                                                    <p className={`font-medium leading-snug transition-colors ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                        {goal.statement}
                                                    </p>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Continue Button */}
                                <div className="flex flex-col items-center gap-3 pt-4">
                                    <Button
                                        size="lg"
                                        className="w-full md:w-80 text-lg h-14 gap-3 shadow-lg hover:shadow-primary/20 transition-all"
                                        onClick={() => setStep('integrations')}
                                        disabled={selectedGoals.length === 0}
                                    >
                                        Continue
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                    <p className="text-sm text-zinc-500">
                                        Select at least one to continue
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: INTEGRATIONS SELECTION */}
                        {step === 'integrations' && (
                            <motion.div
                                key="integrations"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.4 }}
                                className="space-y-8"
                            >
                                <div className="text-center space-y-3">
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                        Which tools do you use?
                                    </h1>
                                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
                                        Select the tools you'd like to connect. You'll set them up next.
                                    </p>
                                </div>

                                {/* Integration Cards Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {INTEGRATIONS.map((integration, index) => {
                                        const isSelected = selectedIntegrations.includes(integration.id);
                                        return (
                                            <motion.button
                                                key={integration.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => toggleIntegration(integration.id)}
                                                className={`
                                                    relative group flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-200 text-center
                                                    ${isSelected
                                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-lg shadow-violet-500/10 scale-[1.02]'
                                                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md'
                                                    }
                                                `}
                                            >
                                                {/* Selection Badge */}
                                                <div className={`
                                                    absolute -top-2 -right-2 w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center transition-all duration-200 shadow-md
                                                    ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                                                `}>
                                                    <Check className="w-4 h-4" strokeWidth={3} />
                                                </div>

                                                {/* Logo Container */}
                                                <div className={`
                                                    w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 transition-all duration-200
                                                    ${isSelected ? 'bg-violet-100 dark:bg-violet-900/50' : 'group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}
                                                `}>
                                                    <img
                                                        src={integration.logo}
                                                        alt={integration.name}
                                                        className={`w-8 h-8 object-contain ${integration.darkInvert ? 'dark:invert' : ''}`}
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                </div>

                                                {/* Name & Description */}
                                                <h3 className={`font-semibold text-sm mb-1 transition-colors ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-900 dark:text-white'}`}>
                                                    {integration.name}
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-500 leading-tight line-clamp-2">
                                                    {integration.description}
                                                </p>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Finish Button */}
                                <div className="flex flex-col items-center gap-3 pt-4">
                                    <Button
                                        size="lg"
                                        className="w-full md:w-80 text-lg h-14 gap-3 shadow-lg hover:shadow-primary/20 transition-all bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                                        onClick={handleFinish}
                                        disabled={selectedIntegrations.length === 0}
                                    >
                                        Set Up Integrations
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                    <p className="text-sm text-zinc-500">
                                        You'll connect these on the next page
                                    </p>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
