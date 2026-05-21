import { describe, it, expect } from 'vitest';
import { 
    parseTime, 
    formatTime, 
    timeRangesOverlap, 
    calculateEndTime,
    validateBusinessHours,
    hasConflict
} from './scheduling-validation';

describe('Scheduling Validation Utilities', () => {
    describe('Time parsing & formatting', () => {
        it('should correctly parse HH:MM to minutes since midnight', () => {
            expect(parseTime('00:00')).toBe(0);
            expect(parseTime('08:30')).toBe(8 * 60 + 30);
            expect(parseTime('23:59')).toBe(23 * 60 + 59);
        });

        it('should correctly format minutes since midnight to HH:MM', () => {
            expect(formatTime(0)).toBe('00:00');
            expect(formatTime(8 * 60 + 30)).toBe('08:30');
            expect(formatTime(23 * 60 + 59)).toBe('23:59');
        });

        it('should correctly calculate end time', () => {
            expect(calculateEndTime('08:30', 60)).toBe('09:30');
            expect(calculateEndTime('14:45', 45)).toBe('15:30');
        });
    });

    describe('Overlap checks', () => {
        it('should return true for overlapping ranges', () => {
            expect(timeRangesOverlap('08:00', '09:00', '08:30', '09:30')).toBe(true);
            expect(timeRangesOverlap('08:00', '09:00', '07:30', '08:30')).toBe(true);
            expect(timeRangesOverlap('08:00', '09:00', '08:00', '09:00')).toBe(true);
            expect(timeRangesOverlap('08:00', '09:00', '08:15', '08:45')).toBe(true);
        });

        it('should return false for non-overlapping adjacent ranges', () => {
            expect(timeRangesOverlap('08:00', '09:00', '09:00', '10:00')).toBe(false);
            expect(timeRangesOverlap('08:00', '09:00', '07:00', '08:00')).toBe(false);
        });

        it('should return false for completely separate ranges', () => {
            expect(timeRangesOverlap('08:00', '09:00', '10:00', '11:00')).toBe(false);
            expect(timeRangesOverlap('14:00', '15:00', '11:00', '12:00')).toBe(false);
        });
    });

    describe('Business hours validation', () => {
        const openingHours = {
            monday: { open: true, start: '08:00', end: '18:00' },
            tuesday: { open: false, start: '00:00', end: '00:00' }
        };

        it('should succeed if openingHours is not provided', () => {
            expect(validateBusinessHours(new Date('2026-05-18T10:00:00Z'), '08:30', '09:30', null)).toEqual({ valid: true });
        });

        it('should fail if the business is closed on that day', () => {
            // Tuesday
            const date = new Date('2026-05-19T10:00:00'); // Tuesday
            const result = validateBusinessHours(date, '08:30', '09:30', openingHours);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('não atende neste dia');
        });

        it('should fail if booking starts before business hours', () => {
            // Monday
            const date = new Date('2026-05-18T10:00:00'); // Monday
            const result = validateBusinessHours(date, '07:30', '08:30', openingHours);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('fora do seu horário de trabalho');
        });

        it('should fail if booking ends after business hours', () => {
            // Monday
            const date = new Date('2026-05-18T10:00:00'); // Monday
            const result = validateBusinessHours(date, '17:30', '18:30', openingHours);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('fora do seu horário de trabalho');
        });

        it('should pass if booking is within business hours', () => {
            // Monday
            const date = new Date('2026-05-18T10:00:00'); // Monday
            const result = validateBusinessHours(date, '09:00', '10:00', openingHours);
            expect(result.valid).toBe(true);
        });
    });

    describe('Conflict detection', () => {
        const existingBookings = [
            { id: 1, date: '2026-05-18T12:00:00', time: '09:00', duration: 60 },
            { id: 2, date: '2026-05-18T12:00:00', time: '14:00', duration: 45 }
        ];

        it('should detect overlaps on the same day', () => {
            const date = new Date('2026-05-18T12:00:00');
            const result = hasConflict({ date, startTime: '09:30', endTime: '10:30' }, existingBookings);
            expect(result.hasConflict).toBe(true);
            expect(result.conflictingBooking?.id).toBe(1);
        });

        it('should not detect conflict on different days', () => {
            const date = new Date('2026-05-19T12:00:00');
            const result = hasConflict({ date, startTime: '09:30', endTime: '10:30' }, existingBookings);
            expect(result.hasConflict).toBe(false);
        });

        it('should not detect conflict on same day at different time slots', () => {
            const date = new Date('2026-05-18T12:00:00');
            const result = hasConflict({ date, startTime: '10:30', endTime: '11:30' }, existingBookings);
            expect(result.hasConflict).toBe(false);
        });
    });
});
