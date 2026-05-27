import Link from 'next/link';
import { AlertTriangle, Bot, CheckSquare, GitPullRequest, Search, TimerReset } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { KpiCard } from '@/components/ui/kpi-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AgentActivityTable } from '@/components/admin/agentes/agent-activity-table';
import { AgentCommandCenterNav } from '@/components/admin/agentes/agent-command-center-nav';
import { DepartmentOverview } from '@/components/admin/agentes/department-overview';
import { DepartmentStatusBadge, RiskBadge } from '@/components/admin/agentes/agent-status-badge';
import { MockDataNotice } from '@/components/admin/agentes/mock-data-notice';
import { GitHubOperationalPanel } from '@/components/admin/agentes/github-operational-panel';
import {
    agentEvents,
    agentRuns,
    agents,
    approvalRequests,
    departments,
    mockGithubLinks,
} from '@/lib/admin/agent-command-center-data';

export default function AdminAgentsDashboardPage() {
    const activeAgents = agents.filter((agent) => agent.status === 'active' || agent.status === 'watching').length;
    const pendingApprovals = approvalRequests.filter((approval) => approval.status === 'pending' || approval.status === 'reviewing').length;
    const alertCount = agentEvents.filter((event) => event.severity !== 'low').length;
    const riskyChecks = mockGithubLinks.filter((link) => link.checksStatus.includes('risco') || link.checksStatus.includes('falha')).length;

    return (
        <div className="space-y-8 pb-12">
            <SectionHeader
                title="Agent Command Center"
                subtitle="Painel visual simulado para acompanhar agentes, departamentos, riscos e aprovações"
                action={
                    <Button asChild className="gap-2 bg-bee-amber font-bold text-bee-midnight shadow-sm hover:bg-amber-500">
                        <Link href="/admin/agentes/aprovacoes">
                            <CheckSquare className="h-4 w-4" />
                            Ver aprovações
                        </Link>
                    </Button>
                }
            />

            <MockDataNotice />
            <AgentCommandCenterNav />

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <KpiCard title="Agentes ativos" value={String(activeAgents)} color="amber" icon={<Bot className="h-6 w-6" />} />
                <KpiCard title="Execuções" value={String(agentRuns.length)} color="default" icon={<TimerReset className="h-6 w-6" />} />
                <KpiCard title="Aprovações" value={String(pendingApprovals)} color="black" icon={<CheckSquare className="h-6 w-6" />} />
                <KpiCard title="Alertas" value={String(alertCount)} color="default" icon={<AlertTriangle className="h-6 w-6" />} />
                <KpiCard title="Checks em risco" value={String(riskyChecks)} color="amber" icon={<GitPullRequest className="h-6 w-6" />} />
            </section>

            <GitHubOperationalPanel />

            <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-white/60 bg-white/40 p-2 shadow-sm backdrop-blur-sm">
                <div className="relative min-w-[260px] flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Buscar agente, departamento ou risco..." className="h-11 rounded-2xl border-slate-100 bg-white pl-10 text-sm font-medium shadow-sm" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="h-11 w-48 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todos os departamentos</SelectItem>
                        <SelectItem value="cto" className="rounded-xl font-bold">CTO</SelectItem>
                        <SelectItem value="support" className="rounded-xl font-bold">Suporte</SelectItem>
                        <SelectItem value="growth" className="rounded-xl font-bold">Growth</SelectItem>
                    </SelectContent>
                </Select>
                <Select defaultValue="mock">
                    <SelectTrigger className="h-11 w-44 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="mock" className="rounded-xl font-bold">Somente simulado</SelectItem>
                        <SelectItem value="attention" className="rounded-xl font-bold">Atenção</SelectItem>
                        <SelectItem value="blocked" className="rounded-xl font-bold">Bloqueados</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <section className="space-y-4">
                <SectionHeader title="Status por Departamento" subtitle="Saúde operacional simulada por área do BeeGym OS" />
                <DepartmentOverview departments={departments.slice(0, 6)} />
            </section>

            <section className="space-y-4">
                <SectionHeader title="Últimas Atividades" subtitle="Eventos recentes de agentes e subagentes com evidência simulada" />
                <AgentActivityTable runs={agentRuns.slice(0, 5)} />
            </section>

            <section className="space-y-4">
                <SectionHeader title="Alertas Simulados" subtitle="Sinais de risco que exigiriam decisão humana em fases futuras" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {agentEvents.filter((event) => event.severity !== 'low').map((event) => {
                        const department = departments.find((item) => item.id === event.departmentId);
                        return (
                            <div key={event.id} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black text-bee-midnight">{event.title}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-400">{department?.name}</p>
                                    </div>
                                    <RiskBadge risk={event.severity} />
                                </div>
                                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">{event.evidence}</p>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                                    {department && <DepartmentStatusBadge status={department.status} />}
                                    <Button asChild variant="ghost" size="sm" className="h-9 rounded-xl text-xs font-bold text-slate-400 hover:bg-amber-50 hover:text-bee-amber">
                                        <Link href={`/admin/agentes/${event.agentId}`}>Ver agente</Link>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
