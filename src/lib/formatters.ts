import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formats a date string or Date object to DD/MM/YYYY
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return "-";
    try {
        const d = typeof date === 'string' ? parseISO(date) : date;
        return format(d, "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
        return "-";
    }
}

/**
 * Formats a number to Brazilian decimal standard (e.g., 1,23)
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined || value === "") return "-";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "-";

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Formats a number to Brazilian currency standard (R$ 1,23)
 */
export function formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === "") return "R$ 0,00";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "R$ 0,00";

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(num);
}

/**
 * Compact number abbreviation for KPI cards.
 * 1.000 → 1k | 100.000 → 100k | 1.000.000 → 1M
 * Values below 1000 are returned as-is (no decimals).
 */
export function formatK(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === "") return "0";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "0";

    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 1_000_000) {
        const v = abs / 1_000_000;
        return sign + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')) + 'M';
    }
    if (abs >= 1_000) {
        const v = abs / 1_000;
        return sign + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')) + 'k';
    }
    return sign + Math.round(abs).toString();
}

/**
 * Compact currency for KPI cards.
 * R$ 1.500 → R$ 1,5k | R$ 100.000 → R$ 100k | R$ 1.200.000 → R$ 1,2M
 * Below R$ 1000 renders the full BRL value.
 */
export function formatCurrencyK(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === "") return "R$ 0";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "R$ 0";

    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 1_000_000) {
        const v = abs / 1_000_000;
        return sign + 'R$ ' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')) + 'M';
    }
    if (abs >= 1_000) {
        const v = abs / 1_000;
        return sign + 'R$ ' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace('.', ',')) + 'k';
    }
    // Below 1000: full BRL
    return sign + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(abs);
}
