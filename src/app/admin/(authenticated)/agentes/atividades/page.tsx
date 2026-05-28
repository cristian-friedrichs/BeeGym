import { Search } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgentActivityTable } from '@/components/admin/agentes/agent-activity-table';
import { AgentCommandCenterNav } from '@/components/admin/agentes/agent-command-center-nav';
import { MockDataNotice } from '@/components/admin/agentes/mock-data-notice';
import { GitHubOperationalPanel } from '@/components/admin/agentes/github-operational-panel';
import { OperationalTimeline } from '@/components/admin/agentes/operational-timeline';
import { agentEvents, agentRuns } from '@/lib/admin/agent-command-center-data';

export default function AgentActivitiesPage() {
    return (
        <div className="space-y-8 pb-12">
            <SectionHeader title="Atividades dos Agentes" subtitle="Timeline executiva com eventos simulados e GitHub real em leitura pública" />
            <MockDataNotice />
            <AgentCommandCenterNav />

            <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-white/60 bg-white/40 p-2 shadow-sm backdrop-blur-sm">
                <div className="relative min-w-[260px] flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Buscar por agente, tarefa, branch ou evidência..." className="h-11 rounded-2xl border-slate-100 bg-white pl-10 text-sm font-medium shadow-sm" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="h-11 w-44 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todos os status</SelectItem>
                        <SelectItem value="running" className="rounded-xl font-bold">Em andamento</SelectItem>
                        <SelectItem value="waiting" className="rounded-xl font-bold">Aguardando CEO</SelectItem>
                        <SelectItem value="completed" className="rounded-xl font-bold">Concluído</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="all">
                    <SelectTrigger className="h-11 w-40 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todos riscos</SelectItem>
                        <SelectItem value="low" className="rounded-xl font-bold text-green-700">Baixo</SelectItem>
                        <SelectItem value="medium" className="rounded-xl font-bold text-amber-700">Médio</SelectItem>
                        <SelectItem value="high" className="rounded-xl font-bold text-red-700">Alto</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <OperationalTimeline agentEvents={agentEvents} limit={14} compact />

            <AgentActivityTable runs={agentRuns} />

            <GitHubOperationalPanel variant="activities" />
        </div>
    );
}
