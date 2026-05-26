import { Search } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgentCommandCenterNav } from '@/components/admin/agentes/agent-command-center-nav';
import { DepartmentOverview } from '@/components/admin/agentes/department-overview';
import { MockDataNotice } from '@/components/admin/agentes/mock-data-notice';
import { departments } from '@/lib/admin/agent-command-center-data';

export default function AgentDepartmentsPage() {
    return (
        <div className="space-y-8 pb-12">
            <SectionHeader title="Departamentos" subtitle="Visao mockada por departamento, lider, agentes, tarefas e saude operacional" />
            <MockDataNotice />
            <AgentCommandCenterNav />

            <div className="flex flex-wrap items-center gap-3 rounded-[2rem] border border-white/60 bg-white/40 p-2 shadow-sm backdrop-blur-sm">
                <div className="relative min-w-[260px] flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Buscar departamento ou agente..." className="h-11 rounded-2xl border-slate-100 bg-white pl-10 text-sm font-medium shadow-sm" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="h-11 w-48 rounded-2xl border-slate-100 bg-white font-bold text-slate-600 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                        <SelectItem value="all" className="rounded-xl font-bold">Todos os status</SelectItem>
                        <SelectItem value="healthy" className="rounded-xl font-bold text-green-700">Saudavel</SelectItem>
                        <SelectItem value="attention" className="rounded-xl font-bold text-amber-700">Atencao</SelectItem>
                        <SelectItem value="blocked" className="rounded-xl font-bold text-red-700">Bloqueado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DepartmentOverview departments={departments} />
        </div>
    );
}
