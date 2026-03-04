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
