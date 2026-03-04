import { createClient } from '@/lib/supabase/client';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

export interface FixedScheduleSlot {
    dayOfWeek: string; // 'monday', 'tuesday', etc.
    time: string; // 'HH:MM'
}

export interface GenerateScheduleOptions {
    studentId: string;
    organizationId: string;
    unitId: string;
    fixedSchedule: FixedScheduleSlot[];
    duration: number; // in minutes
    monthsAhead?: number;
}

/**
 * Generate recurring calendar events for a student's fixed schedule
 */
export async function generateFixedScheduleEvents(
    options: GenerateScheduleOptions
): Promise<{ success: boolean; eventsCreated: number; error?: string }> {
    const {
        studentId,
        organizationId,
        unitId,
        fixedSchedule,
        duration,
        monthsAhead = 1,
    } = options;

    const supabase = createClient();
    const events: any[] = [];
    const today = new Date();
    const endDate = addMonths(today, monthsAhead);

    try {
        // For each day in the fixed schedule
        for (const schedule of fixedSchedule) {
            let currentDate = getNextDayOfWeek(today, schedule.dayOfWeek);

            // Generate events until end date
            while (currentDate <= endDate) {
                events.push({
                    student_id: studentId,
                    organization_id: organizationId,
                    unit_id: unitId,
                    date: format(currentDate, 'yyyy-MM-dd'),
                    start_time: schedule.time,
                    duration: duration,
                    day_of_week: schedule.dayOfWeek,
                    status: 'SCHEDULED',
                    event_type: 'RECURRING',
                });

                // Move to next week
                currentDate = addWeeks(currentDate, 1);
            }
        }

        // Bulk insert all events
        const { error, data } = await (supabase as any)
            .from('calendar_events')
            .insert(events)
            .select();

        if (error) {
            console.error('Error generating schedule events:', error);
            return {
                success: false,
                eventsCreated: 0,
                error: error.message,
            };
        }

        return {
            success: true,
            eventsCreated: data?.length || 0,
        };
    } catch (error: any) {
        console.error('Error in generateFixedScheduleEvents:', error);
        return {
            success: false,
            eventsCreated: 0,
            error: error.message,
        };
    }
}

/**
 * Get the next occurrence of a specific day of the week
 */
function getNextDayOfWeek(from: Date, dayOfWeek: string): Date {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayOfWeek.toLowerCase());

    if (targetDay === -1) {
        throw new Error(`Invalid day of week: ${dayOfWeek}`);
    }

    const currentDay = from.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;

    // If it's 0, it means today is the target day, so we want next week
    const daysToAdd = daysUntilTarget === 0 ? 7 : daysUntilTarget;

    return addDays(from, daysToAdd);
}

/**
 * Delete all future recurring events for a student
 * Useful when changing a student's schedule
 */
export async function deleteFixedScheduleEvents(
    studentId: string
): Promise<{ success: boolean; eventsDeleted: number; error?: string }> {
    const supabase = createClient();
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
        const { error, data } = await (supabase as any)
            .from('calendar_events')
            .delete()
            .eq('student_id', studentId)
            .eq('event_type', 'RECURRING')
            .gte('date', today)
            .select();

        if (error) {
            return {
                success: false,
                eventsDeleted: 0,
                error: error.message,
            };
        }

        return {
            success: true,
            eventsDeleted: data?.length || 0,
        };
    } catch (error: any) {
        return {
            success: false,
            eventsDeleted: 0,
            error: error.message,
        };
    }
}
