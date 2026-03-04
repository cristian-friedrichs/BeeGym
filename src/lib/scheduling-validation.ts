/**
 * Scheduling Validation Utilities
 * Reusable functions for time parsing, conflict detection, and capacity management
 */

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to time string (HH:MM)
 */
export function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if a time falls within a range
 */
export function isTimeInRange(time: number, start: number, end: number): boolean {
    return time >= start && time < end;
}

/**
 * Calculate end time given start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
    const startMinutes = parseTime(startTime);
    const endMinutes = startMinutes + durationMinutes;
    return formatTime(endMinutes);
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean {
    const s1 = parseTime(start1);
    const e1 = parseTime(end1);
    const s2 = parseTime(start2);
    const e2 = parseTime(end2);

    // Ranges overlap if: start1 < end2 AND start2 < end1
    return s1 < e2 && s2 < e1;
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(startTime: string, endTime: string): string {
    return `${startTime} - ${endTime}`;
}

/**
 * Generate time slots for a day
 */
export function generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number = 30
): string[] {
    const slots: string[] = [];
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    for (let time = start; time < end; time += intervalMinutes) {
        slots.push(formatTime(time));
    }

    return slots;
}

/**
 * Get day of week key from Date object
 */
export function getDayOfWeekKey(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

/**
 * Validate if booking time is within business hours
 */
export function validateBusinessHours(
    date: Date,
    startTime: string,
    endTime: string,
    openingHours: any
): { valid: boolean; message?: string } {
    if (!openingHours) {
        return { valid: true };
    }

    const dayKey = getDayOfWeekKey(date);
    const daySettings = openingHours[dayKey];

    if (!daySettings || !daySettings.open) {
        return {
            valid: false,
            message: 'O BeeGym não atende neste dia da semana',
        };
    }

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const openStart = parseTime(daySettings.start);
    const openEnd = parseTime(daySettings.end);

    if (start < openStart || end > openEnd) {
        return {
            valid: false,
            message: `O BeeGym não permite agendamentos fora do seu horário de trabalho (${daySettings.start} - ${daySettings.end})`,
        };
    }

    return { valid: true };
}

/**
 * Check for booking conflicts
 */
export interface Booking {
    id?: number;
    date: string;
    time: string;
    duration: number;
}

export function hasConflict(
    newBooking: { date: Date; startTime: string; endTime: string },
    existingBookings: Booking[]
): { hasConflict: boolean; conflictingBooking?: Booking } {
    const newDateStr = newBooking.date.toISOString().split('T')[0];

    for (const booking of existingBookings) {
        const bookingDateStr = new Date(booking.date).toISOString().split('T')[0];

        // Only check bookings on the same day
        if (bookingDateStr !== newDateStr) continue;

        const bookingEndTime = calculateEndTime(booking.time, booking.duration);

        if (timeRangesOverlap(newBooking.startTime, newBooking.endTime, booking.time, bookingEndTime)) {
            return { hasConflict: true, conflictingBooking: booking };
        }
    }

    return { hasConflict: false };
}

/**
 * Count bookings in a specific time slot
 */
export function countBookingsInSlot(
    date: Date,
    startTime: string,
    endTime: string,
    existingBookings: Booking[]
): number {
    const dateStr = date.toISOString().split('T')[0];
    let count = 0;

    for (const booking of existingBookings) {
        const bookingDateStr = new Date(booking.date).toISOString().split('T')[0];

        if (bookingDateStr !== dateStr) continue;

        const bookingEndTime = calculateEndTime(booking.time, booking.duration);

        if (timeRangesOverlap(startTime, endTime, booking.time, bookingEndTime)) {
            count++;
        }
    }

    return count;
}
