import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, XCircle, CheckCircle, Ban } from 'lucide-react';

type Status = 'PENDENTE' | 'AGUARDANDO_PAGAMENTO' | 'TRIAL' | 'ATIVO' | 'INADIMPLENTE' | 'INATIVO' | 'TESTE' | 'DEMO';

const statusConfig: Record<Status, { label: string; className: string; Icon: any }> = {
    PENDENTE: {
        label: 'Pendente',
        className: 'bg-orange-50 text-orange-600 border-orange-200',
        Icon: Clock,
    },
    AGUARDANDO_PAGAMENTO: {
        label: 'Aguardando Pgto',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        Icon: Clock,
    },
    TRIAL: {
        label: 'Trial',
        className: 'bg-blue-50 text-blue-600 border-blue-200',
        Icon: Clock,
    },
    ATIVO: {
        label: 'Ativo',
        className: 'bg-green-50 text-green-700 border-green-200',
        Icon: CheckCircle,
    },
    TESTE: {
        label: 'Teste',
        className: 'bg-purple-50 text-purple-600 border-purple-200',
        Icon: CheckCircle,
    },
    DEMO: {
        label: 'Demo',
        className: 'bg-cyan-50 text-cyan-600 border-cyan-200',
        Icon: CheckCircle,
    },
    INADIMPLENTE: {
        label: 'Inadimplente',
        className: 'bg-red-50 text-red-700 border-red-200',
        Icon: AlertTriangle,
    },
    INATIVO: {
        label: 'Inativo',
        className: 'bg-slate-800 text-white border-slate-700',
        Icon: Ban,
    }
};

interface ContratanteStatusBadgeProps {
    status: string;
}

export function ContratanteStatusBadge({ status }: ContratanteStatusBadgeProps) {
    const config = statusConfig[status as Status] ?? {
        label: status,
        className: 'bg-slate-50 text-slate-500 border-slate-200',
        Icon: null,
    };
    const { label, className, Icon } = config;

    return (
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border', className)}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}
