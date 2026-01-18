'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { SubscriptionTier } from '@/lib/subscription';

interface SubscriptionContextType {
    tier: SubscriptionTier;
    isLoading: boolean;
    refreshSubscription: () => Promise<void>;
    updateTier: (newTier: SubscriptionTier) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [tier, setTier] = useState<SubscriptionTier>('free');
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchSubscription = useCallback(async () => {
        if (!session?.user?.email) {
            setIsLoading(false);
            return;
        }

        try {
            const userId = session.user.email;
            const response = await axios.get(`${API_URL}/subscription/tier`, {
                headers: { 'x-user-id': userId },
            });
            
            const subscriptionTier = (response.data.tier || 'free') as SubscriptionTier;
            setTier(subscriptionTier);
        } catch (error) {
            console.error('Failed to fetch subscription tier:', error);
            // Default to free on error
            setTier('free');
        } finally {
            setIsLoading(false);
        }
    }, [session, API_URL]);

    const updateTier = useCallback(async (newTier: SubscriptionTier) => {
        if (!session?.user?.email) return;

        try {
            const userId = session.user.email;
            await axios.patch(
                `${API_URL}/subscription/tier`,
                { tier: newTier },
                {
                    headers: { 'x-user-id': userId },
                }
            );
            setTier(newTier);
        } catch (error) {
            console.error('Failed to update subscription tier:', error);
            throw error;
        }
    }, [session, API_URL]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    return (
        <SubscriptionContext.Provider
            value={{
                tier,
                isLoading,
                refreshSubscription: fetchSubscription,
                updateTier,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}

