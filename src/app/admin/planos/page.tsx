import { PlanosTable } from '@/components/admin/planos/PlanosTable';

export default function AdminPlanosPage() {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold text-[#00173F] font-display">Planos</h2>
                <p className="text-sm text-slate-500 mt-0.5">Gerencie os planos de assinatura e sincronize com a EFI</p>
            </div>
            <PlanosTable />
        </div>
    );
}
