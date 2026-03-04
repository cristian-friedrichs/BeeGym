import { ContratantesTable } from '@/components/admin/contratantes/ContratantesTable';

export default function AdminContratantesPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-[#00173F] font-display">Clientes</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Gerencie clientes, assinaturas e status do app</p>
                </div>
            </div>
            <ContratantesTable />
        </div>
    );
}
