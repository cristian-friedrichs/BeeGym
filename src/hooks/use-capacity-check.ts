import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrganizationSettings } from './use-organization-settings';

export interface CapacityCheckResult {
    isFull: boolean;
    currentCount: number;
    maxCapacity: number;
}

export function useCapacityCheck() {
    const { settings } = useOrganizationSettings();
    const [isChecking, setIsChecking] = useState(false);
    const supabase = createClient();

    /**
     * Check if a specific time slot is at capacity
     * @param dayOfWeek - Day of week (e.g., 'monday', 'tuesday')
     * @param time - Time in HH:MM format
     * @returns Capacity check result
     */
    const checkCapacity = useCallback(async (
        dayOfWeek: string,
        time: string
    ): Promise<CapacityCheckResult> => {
        setIsChecking(true);

        try {
            // Get user's organization
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data: userData } = await (supabase as any)
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!(userData as any)?.organization_id) {
                throw new Error('Organization not found');
            }

            const orgId = (userData as any).organization_id as string;

            // Count existing bookings for this time slot
            const { data: events, error } = await (supabase as any)
                .from('calendar_events')
                .select('id')
                .eq('organization_id', orgId)
                .eq('day_of_week', dayOfWeek)
                .eq('start_time', time);

            if (error) throw error;

            const currentCount = events?.length || 0;
            const maxCapacity = settings.max_capacity_per_slot;

            return {
                isFull: currentCount >= maxCapacity,
                currentCount,
                maxCapacity,
            };
        } catch (error) {
            console.error('Error checking capacity:', error);
            // Return safe default (not full) on error
            return {
                isFull: false,
                currentCount: 0,
                maxCapacity: settings.max_capacity_per_slot,
            };
        } finally {
            setIsChecking(false);
        }
    }, [settings.max_capacity_per_slot, supabase]);

    /**
     * Check capacity for multiple time slots at once
     */
    const checkMultipleCapacities = useCallback(async (
        slots: Array<{ dayOfWeek: string; time: string }>
    ): Promise<Map<string, CapacityCheckResult>> => {
        const results = new Map<string, CapacityCheckResult>();

        for (const slot of slots) {
            const key = `${slot.dayOfWeek}-${slot.time}`;
            const result = await checkCapacity(slot.dayOfWeek, slot.time);
            results.set(key, result);
        }

        return results;
    }, [checkCapacity]);

    return {
        checkCapacity,
        checkMultipleCapacities,
        isChecking,
    };
}
