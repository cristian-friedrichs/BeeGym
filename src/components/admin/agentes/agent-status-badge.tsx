import { AlertTriangle, CheckCircle2, Clock, PlayCircle, ShieldAlert, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
    AgentDepartmentStatus,
    AgentRiskLevel,
    AgentRunStatus,
    ApprovalPriority,
    ApprovalStatus,
} from '@/lib/admin/agent-command-center-data';

type BadgeTone = 'green' | 'amber' | 'blue' | 'orange' | 'red' | 'slate';

const toneClassName: Record<BadgeTone, string> = {
    green: 'bg-green-50 text-green-700 border-green-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100',
};

export function AgentPill({
    label,
    tone = 'slate',
    className,
}: {
    label: string;
    tone?: BadgeTone;
    className?: string;
}) {
    return (
        <Badge variant="outline" className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider hover:bg-transparent', toneClassName[tone], className)}>
            {label}
        </Badge>
    );
}

export function DepartmentStatusBadge({ status }: { status: AgentDepartmentStatus }) {
    const config = {
        healthy: { label: 'Saudável', tone: 'green' as BadgeTone, Icon: CheckCircle2 },
        attention: { label: 'Atenção', tone: 'amber' as BadgeTone, Icon: AlertTriangle },
        blocked: { label: 'Bloqueado', tone: 'red' as BadgeTone, Icon: ShieldAlert },
    }[status];

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', toneClassName[config.tone])}>
            <config.Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}

export function RunStatusBadge({ status }: { status: AgentRunStatus }) {
    const config = {
        completed: { label: 'Concluído', tone: 'green' as BadgeTone, Icon: CheckCircle2 },
        running: { label: 'Em andamento', tone: 'blue' as BadgeTone, Icon: PlayCircle },
        waiting_approval: { label: 'Aguardando CEO', tone: 'amber' as BadgeTone, Icon: Clock },
        failed: { label: 'Falha', tone: 'red' as BadgeTone, Icon: XCircle },
    }[status];

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', toneClassName[config.tone])}>
            <config.Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}

export function RiskBadge({ risk }: { risk: AgentRiskLevel }) {
    const config = {
        low: { label: 'Baixo', tone: 'green' as BadgeTone },
        medium: { label: 'Médio', tone: 'amber' as BadgeTone },
        high: { label: 'Alto', tone: 'red' as BadgeTone },
    }[risk];

    return <AgentPill label={config.label} tone={config.tone} />;
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
    const config = {
        pending: { label: 'Pendente', tone: 'amber' as BadgeTone },
        reviewing: { label: 'Em revisão', tone: 'blue' as BadgeTone },
        approved_mock: { label: 'Aprovado simulado', tone: 'green' as BadgeTone },
        rejected_mock: { label: 'Rejeitado simulado', tone: 'red' as BadgeTone },
    }[status];

    return <AgentPill label={config.label} tone={config.tone} />;
}

export function PriorityBadge({ priority }: { priority: ApprovalPriority }) {
    const config = {
        low: { label: 'Baixa', tone: 'slate' as BadgeTone },
        medium: { label: 'Média', tone: 'amber' as BadgeTone },
        high: { label: 'Alta', tone: 'orange' as BadgeTone },
        critical: { label: 'Crítica', tone: 'red' as BadgeTone },
    }[priority];

    return <AgentPill label={config.label} tone={config.tone} />;
}
