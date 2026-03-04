import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface OpeningHours {
    [key: string]: {
        open: boolean;
        start: string;
        end: string;
    };
}

export interface OrganizationSettings {
    opening_hours: OpeningHours | null;
    allow_concurrent_bookings: boolean;
    max_capacity_per_slot: number;
    default_session_duration: number;
}

const DEFAULT_SETTINGS: OrganizationSettings = {
    opening_hours: null,
    allow_concurrent_bookings: false,
    max_capacity_per_slot: 1,
    default_session_duration: 60,
};

export function useOrganizationSettings() {
    const [settings, setSettings] = useState<OrganizationSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchSettings() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError('User not authenticated');
                    setIsLoading(false);
                    return;
                }

                // Get user's organization_id from profiles
                const { data: userData } = await (supabase as any)
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (!(userData as any)?.organization_id) {
                    setError('Organization not found');
                    setIsLoading(false);
                    return;
                }

                // Fetch organization settings
                const { data: orgData, error: orgError } = await (supabase as any)
                    .from('organizations')
                    .select('opening_hours')
                    .eq('id', (userData as any).organization_id as string)
                    .single();

                if (orgError) throw orgError;

                if (orgData) {
                    setSettings({
                        opening_hours: orgData.opening_hours as any as OpeningHours | null,
                        allow_concurrent_bookings: false,
                        max_capacity_per_slot: 1,
                        default_session_duration: 60,
                    });
                }
            } catch (err: any) {
                console.error('Error fetching organization settings:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSettings();
    }, []);

    /**
     * Check if a time slot falls within opening hours for a given date
     */
    const isWithinOpeningHours = (date: Date, startTime: string, endTime: string): boolean => {
        if (!settings.opening_hours) return true; // No restrictions if not configured

        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
        const daySettings = settings.opening_hours[dayOfWeek];

        if (!daySettings || !daySettings.open) return false; // Day is closed

        const start = parseTime(startTime);
        const end = parseTime(endTime);
        const openStart = parseTime(daySettings.start);
        const openEnd = parseTime(daySettings.end);

        return start >= openStart && end <= openEnd;
    };

    /**
     * Get available time slots for a given date
     */
    const getAvailableTimeSlots = (date: Date, intervalMinutes: number = 30): string[] => {
        if (!settings.opening_hours) return [];

        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
        const daySettings = settings.opening_hours[dayOfWeek];

        if (!daySettings || !daySettings.open) return [];

        const slots: string[] = [];
        const openStart = parseTime(daySettings.start);
        const openEnd = parseTime(daySettings.end);

        for (let time = openStart; time < openEnd; time += intervalMinutes) {
            slots.push(formatTime(time));
        }

        return slots;
    };

    /**
     * Get default session duration
     */
    const getDefaultDuration = (): number => {
        return settings.default_session_duration;
    };

    return {
        settings,
        isLoading,
        error,
        isWithinOpeningHours,
        getAvailableTimeSlots,
        getDefaultDuration,
    };
}

// Helper functions
function parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
