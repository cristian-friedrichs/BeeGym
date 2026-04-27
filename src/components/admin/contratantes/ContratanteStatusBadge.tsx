import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, XCircle, CheckCircle, Ban, Timer } from 'lucide-react';

// Maps the exact status values written by the Kiwify webhook + isInTrial logic
const statusConfig: Record<string, { label: string; className: string; Icon: any }> = {
    // Active paying subscriber
    ACTIVE: {
        label: 'Ativo',
        className: 'bg-green-50 text-green-700 border-green-200',
        Icon: CheckCircle,
    },
    // Within 7-day trial window (displayed by contratantes/route.ts)
    TRIAL: {
        label: 'Trial',
        className: 'bg-blue-50 text-blue-600 border-blue-200',
        Icon: Timer,
    },
    // Payment pending / waiting
    PENDING: {
        label: 'Pendente',
        className: 'bg-orange-50 text-orange-600 border-orange-200',
        Icon: Clock,
    },
    // Overdue / failed payment
    PAST_DUE: {
        label: 'Inadimplente',
        className: 'bg-red-50 text-red-700 border-red-200',
        Icon: AlertTriangle,
    },
    // Cancelled subscription
    CANCELED: {
        label: 'Cancelado',
        className: 'bg-slate-800 text-white border-slate-700',
        Icon: Ban,
    },
};

interface ContratanteStatusBadgeProps {
    status: string;
}

export function ContratanteStatusBadge({ status }: ContratanteStatusBadgeProps) {
    const config = statusConfig[status] ?? {
        label: status || 'Desconhecido',
        className: 'bg-slate-50 text-slate-500 border-slate-200',
        Icon: XCircle,
    };
    const { label, className, Icon } = config;

    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border', className)}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}
