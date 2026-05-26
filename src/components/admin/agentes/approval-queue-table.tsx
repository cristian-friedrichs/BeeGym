import Link from 'next/link';
import { Eye, ThumbsDown, ThumbsUp } from 'lucide-react';
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
    type ApprovalRequest,
} from '@/lib/admin/agent-command-center-data';
import { ApprovalStatusBadge, PriorityBadge } from './agent-status-badge';

function getAgentName(agentId: string) {
    return agents.find((agent) => agent.id === agentId)?.name ?? 'Agente simulado';
}

function getDepartmentName(departmentId: string) {
    return departments.find((department) => department.id === departmentId)?.shortName ?? 'Depto';
}

export function ApprovalQueueTable({ approvals }: { approvals: ApprovalRequest[] }) {
    return (
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-50 bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ação solicitada</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Departamento</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Risco</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Prioridade</TableHead>
                        <TableHead className="h-12 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitado</TableHead>
                        <TableHead className="h-12 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ações simuladas</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {approvals.map((approval) => (
                        <TableRow key={approval.id} className="border-slate-50 hover:bg-amber-50/30">
                            <TableCell className="max-w-[320px] px-6 py-4">
                                <p className="text-sm font-black text-bee-midnight">{approval.action}</p>
                                <p className="line-clamp-1 text-[11px] font-medium text-slate-400">{approval.impact}</p>
                                <p className="mt-1 text-[11px] font-bold text-slate-500">{getAgentName(approval.requesterAgentId)}</p>
                            </TableCell>
                            <TableCell className="text-xs font-black text-slate-500">{getDepartmentName(approval.departmentId)}</TableCell>
                            <TableCell>
                                <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    {approval.riskArea}
                                </span>
                            </TableCell>
                            <TableCell><ApprovalStatusBadge status={approval.status} /></TableCell>
                            <TableCell><PriorityBadge priority={approval.priority} /></TableCell>
                            <TableCell className="text-right text-xs font-bold text-slate-400">{formatMockDate(approval.requestedAt)}</TableCell>
                            <TableCell>
                                <div className="flex justify-end gap-2">
                                    <Button asChild variant="outline" size="sm" className="h-9 rounded-xl border-slate-100 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50">
                                        <Link href={`/admin/agentes/${approval.requesterAgentId}`}>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            Ver
                                        </Link>
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl border-green-100 bg-green-50 text-xs font-bold text-green-700 hover:bg-green-100">
                                        <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                                        Simular aprovação
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl border-red-100 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100">
                                        <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
                                        Simular rejeição
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {approvals.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-sm font-medium text-slate-400">
                                Nenhuma aprovação simulada encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
