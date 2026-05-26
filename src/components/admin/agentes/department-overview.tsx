import Link from 'next/link';
import { ArrowRight, Bot, CheckSquare, ListChecks, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    getAgent,
    getAgentsByDepartment,
    type AgentDepartment,
} from '@/lib/admin/agent-command-center-data';
import { DepartmentStatusBadge } from './agent-status-badge';

function getLeadName(department: AgentDepartment) {
    return getAgent(department.leadAgentId)?.name ?? 'Lider mockado';
}

export function DepartmentOverview({ departments }: { departments: AgentDepartment[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {departments.map((department) => {
                const departmentAgents = getAgentsByDepartment(department.id);
                const lead = getLeadName(department);
                return (
                    <Card key={department.id} className="overflow-hidden rounded-[2rem] border-slate-100 bg-white shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
                        <CardHeader className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <CardTitle className="truncate text-base font-black text-bee-midnight">{department.name}</CardTitle>
                                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-400">{department.description}</p>
                                </div>
                                <DepartmentStatusBadge status={department.status} />
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lider / agente principal</p>
                                <p className="mt-1 text-sm font-black text-slate-700">{lead}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 p-5 pt-0">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-black uppercase tracking-widest text-slate-400">Saude operacional</span>
                                    <span className="font-black text-bee-midnight">{department.healthScore}%</span>
                                </div>
                                <Progress value={department.healthScore} className="h-2 bg-slate-100 [&>div]:bg-bee-amber" />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-2xl bg-slate-50 p-3">
                                    <Bot className="mb-2 h-4 w-4 text-bee-amber" />
                                    <p className="text-lg font-black text-bee-midnight">{departmentAgents.length}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agentes</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-3">
                                    <ListChecks className="mb-2 h-4 w-4 text-bee-amber" />
                                    <p className="text-lg font-black text-bee-midnight">{department.recentTasks}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tarefas</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-3">
                                    <CheckSquare className="mb-2 h-4 w-4 text-bee-amber" />
                                    <p className="text-lg font-black text-bee-midnight">{department.pendingApprovals}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aprov.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agentes e subagentes</p>
                                <div className="flex flex-wrap gap-2">
                                    {departmentAgents.slice(0, 4).map((agent) => (
                                        <Link key={agent.id} href={`/admin/agentes/${agent.id}`} className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:border-amber-100 hover:bg-amber-50 hover:text-amber-700">
                                            {agent.name}
                                        </Link>
                                    ))}
                                    {departmentAgents.length > 4 && (
                                        <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-400">
                                            +{departmentAgents.length - 4}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                    <ShieldCheck className="h-4 w-4 text-bee-amber" />
                                    {department.focus}
                                </div>
                                <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:bg-amber-50 hover:text-bee-amber">
                                    <Link href={`/admin/agentes/${department.leadAgentId}`} aria-label={`Ver ${lead}`}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
