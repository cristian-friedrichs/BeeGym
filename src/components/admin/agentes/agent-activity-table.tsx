import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    agents,
    departments,
    formatMockDate,
    type AgentRun,
} from '@/lib/admin/agent-command-center-data';
import { RiskBadge, RunStatusBadge } from './agent-status-badge';

function getAgentName(agentId: string) {
    return agents.find((agent) => agent.id === agentId)?.name ?? 'Agente simulado';
}

function getDepartmentName(departmentId: string) {
    return departments.find((department) => department.id === departmentId)?.shortName ?? 'Depto';
}

export function AgentActivityTable({ runs }: { runs: AgentRun[] }) {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-50 bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Agente</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Tarefa</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Autonomia</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Branch / PR</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Risco</TableHead>
                        <TableHead className="h-12 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Horário</TableHead>
                        <TableHead className="h-12 w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {runs.map((run) => (
                        <TableRow key={run.id} className="border-slate-50 hover:bg-amber-50/30">
                            <TableCell className="px-6 py-4">
                                <div>
                                    <p className="text-sm font-black text-bee-midnight">{getAgentName(run.agentId)}</p>
                                    <p className="text-[11px] font-bold text-slate-400">{getDepartmentName(run.departmentId)} - {run.eventType}</p>
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[280px] py-4">
                                <p className="text-sm font-bold text-slate-700">{run.task}</p>
                                <p className="line-clamp-1 text-[11px] font-medium text-slate-400">{run.evidence}</p>
                            </TableCell>
                            <TableCell className="text-xs font-black text-slate-500">{run.autonomyLevel}</TableCell>
                            <TableCell className="max-w-[210px]">
                                <code className="rounded-xl bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500">{run.branchOrPr}</code>
                            </TableCell>
                            <TableCell><RunStatusBadge status={run.status} /></TableCell>
                            <TableCell><RiskBadge risk={run.risk} /></TableCell>
                            <TableCell className="text-right text-xs font-bold text-slate-400">{formatMockDate(run.occurredAt)}</TableCell>
                            <TableCell className="pr-6">
                                <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:bg-amber-50 hover:text-bee-amber">
                                    <Link href={`/admin/agentes/${run.agentId}`} aria-label={`Ver ${getAgentName(run.agentId)}`}>
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {runs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-sm font-medium text-slate-400">
                                Nenhum evento de agente encontrado para a visão atual.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
