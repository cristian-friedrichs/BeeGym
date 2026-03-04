'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Invisible background component that polls the DB every 60 seconds
 * to auto-update workout/class statuses based on their scheduled times.
 * Mount once in the main layout to run across all authenticated pages.
 */
export function StatusAutomator() {
    const supabase = createClient();

    useEffect(() => {
        const runStatusUpdate = async () => {
            try {
                await supabase.rpc('auto_update_session_statuses' as any);
            } catch (error) {
                console.error('[StatusAutomator] Erro na automação de status:', error);
            }
        };

        // Run immediately on mount, then every 60 seconds
        runStatusUpdate();
        const intervalId = setInterval(runStatusUpdate, 60_000);

        return () => clearInterval(intervalId);
    }, []);

    return null;
}
