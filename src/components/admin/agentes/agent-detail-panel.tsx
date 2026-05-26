import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, GitPullRequest, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import {
    getApprovalsByAgent,
    getDepartment,
    getEventsByAgent,
    getGithubLinksByAgent,
    getRunsByAgent,
    type AgentProfile,
} from '@/lib/admin/agent-command-center-data';
import { AgentActivityTable } from './agent-activity-table';
import { ApprovalQueueTable } from './approval-queue-table';
import { AgentPill, DepartmentStatusBadge } from './agent-status-badge';

export function AgentDetailPanel({ agent }: { agent: AgentProfile }) {
    const department = getDepartment(agent.departmentId);
    const runs = getRunsByAgent(agent.id);
    const events = getEventsByAgent(agent.id);
    const approvals = getApprovalsByAgent(agent.id);
    const githubLinks = getGithubLinksByAgent(agent.id);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild variant="outline" className="h-10 rounded-xl border-slate-100 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50">
                    <Link href="/admin/agentes">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Command Center
                    </Link>
                </Button>
                <AgentPill label="Perfil simulado" tone="amber" />
            </div>

            <Card className="overflow-hidden rounded-[2rem] border-slate-100 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-50 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bee-amber text-bee-midnight shadow-sm">
                                    <ShieldAlert className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-bee-midnight">{agent.name}</CardTitle>
                                    <p className="mt-1 text-sm font-bold text-slate-400">{agent.title}</p>
                                </div>
                            </div>
                            <p className="mt-4 max-w-3xl text-sm font-medium leading-relaxed text-slate-600">{agent.summary}</p>
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                            {department && <DepartmentStatusBadge status={department.status} />}
                            <AgentPill label={agent.autonomyLevel} tone="blue" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                    <KpiCard title="Runs simulados" value={String(runs.length)} color="amber" icon={<GitPullRequest className="h-6 w-6" />} />
                    <KpiCard title="Eventos" value={String(events.length)} color="default" icon={<FileText className="h-6 w-6" />} />
                    <KpiCard title="Aprovações" value={String(approvals.length)} color="black" icon={<ShieldAlert className="h-6 w-6" />} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <PermissionList title="Ações permitidas" items={agent.allowedActions} tone="green" />
                <PermissionList title="Ações proibidas" items={agent.forbiddenActions} tone="red" />
                <PermissionList title="Exige CEO" items={agent.approvalRequiredActions} tone="amber" />
            </div>

            <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
                <CardHeader className="p-6">
                    <CardTitle className="text-base font-black text-bee-midnight">Links simulados</CardTitle>
                    <p className="text-xs font-bold text-slate-400">Referências visuais para docs, PRs e issues. Nenhum link chama GitHub real nesta fase.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 p-6 pt-0 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doc operacional</p>
                        <p className="mt-2 text-sm font-bold text-slate-700">{agent.docsPath}</p>
                    </div>
                    {githubLinks.map((link) => (
                        <a key={link.id} href={link.url} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition-colors hover:bg-amber-50/40">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{link.type}</p>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                            </div>
                            <p className="mt-2 text-sm font-bold text-slate-700">{link.label}</p>
                            <p className="mt-1 text-[11px] font-bold text-slate-400">{link.checksStatus}</p>
                        </a>
                    ))}
                </CardContent>
            </Card>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 rounded-full bg-bee-amber" />
                    <div>
                        <h2 className="text-base font-bold text-bee-midnight">Últimas atividades</h2>
                        <p className="text-xs text-slate-400">Histórico visual simulado deste agente.</p>
                    </div>
                </div>
                <AgentActivityTable runs={runs} />
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 rounded-full bg-bee-amber" />
                    <div>
                        <h2 className="text-base font-bold text-bee-midnight">Aprovações relacionadas</h2>
                        <p className="text-xs text-slate-400">Botões permanecem visuais e não executam ação real.</p>
                    </div>
                </div>
                <ApprovalQueueTable approvals={approvals} />
            </section>
        </div>
    );
}

function PermissionList({ title, items, tone }: { title: string; items: string[]; tone: 'green' | 'amber' | 'red' }) {
    return (
        <Card className="rounded-[2rem] border-slate-100 bg-white shadow-sm">
            <CardHeader className="p-5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-0">
                {items.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50/40 p-3">
                        <AgentPill label="" tone={tone} className="mt-1 h-2 w-2 rounded-full p-0" />
                        <p className="text-sm font-bold text-slate-600">{item}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
