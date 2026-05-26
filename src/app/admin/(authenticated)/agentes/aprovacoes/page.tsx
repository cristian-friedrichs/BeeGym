import { Search } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgentCommandCenterNav } from '@/components/admin/agentes/agent-command-center-nav';
import { ApprovalQueueTable } from '@/components/admin/agentes/approval-queue-table';
import { MockDataNotice } from '@/components/admin/agentes/mock-data-notice';
import { approvalRequests } from '@/lib/admin/agent-command-center-data';

export default function AgentApprovalsPage() {
    return (
        <div className="space-y-8 pb-12">
            <SectionHeader title="Aprovações Pendentes" subtitle="Fila visual de ações que exigem decisão do CEO antes de qualquer execução real" />
            <MockDataNotice />
            <AgentCommandCenterNav />

            <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-xs font-bold text-red-700 shadow-sm">
                Ações apenas simuladas. Os botões não chamam API, não alteram banco e não disparam GitHub.
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-white/60 bg-white/40 p-2 shadow-sm backdrop-blur-sm">
                <div className="relative min-w-[260px] flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Buscar aprovação, risco, agente ou impacto..." className="h-11 rounded-2xl border-slate-100 bg-white pl-10 text-sm font-medium shadow-sm" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="h-11 w-44 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todos status</SelectItem>
                        <SelectItem value="pending" className="rounded-xl font-bold">Pendentes</SelectItem>
                        <SelectItem value="reviewing" className="rounded-xl font-bold">Em revisão</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="all">
                    <SelectTrigger className="h-11 w-44 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Toda prioridade</SelectItem>
                        <SelectItem value="critical" className="rounded-xl font-bold text-red-700">Crítica</SelectItem>
                        <SelectItem value="high" className="rounded-xl font-bold text-orange-700">Alta</SelectItem>
                        <SelectItem value="medium" className="rounded-xl font-bold text-amber-700">Média</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ApprovalQueueTable approvals={approvalRequests} />
        </div>
    );
}
