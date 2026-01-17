'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TeamModeContextType {
    hasEngineeringTeam: boolean;
    setHasEngineeringTeam: (value: boolean) => void;
    isLoading: boolean;
}

const TeamModeContext = createContext<TeamModeContextType | undefined>(undefined);

const STORAGE_KEY = 'has_engineering_team';

export function TeamModeProvider({ children }: { children: ReactNode }) {
    const [hasEngineeringTeam, setHasEngineeringTeamState] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load preference from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
                setHasEngineeringTeamState(stored === 'true');
            }
            setIsLoading(false);
        }
    }, []);

    const setHasEngineeringTeam = (value: boolean) => {
        setHasEngineeringTeamState(value);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, String(value));
        }
    };

    return (
        <TeamModeContext.Provider value={{ hasEngineeringTeam, setHasEngineeringTeam, isLoading }}>
            {children}
        </TeamModeContext.Provider>
    );
}

export function useTeamMode() {
    const context = useContext(TeamModeContext);
    if (context === undefined) {
        throw new Error('useTeamMode must be used within a TeamModeProvider');
    }
    return context;
}
