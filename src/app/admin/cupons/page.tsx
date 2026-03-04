import { CuponsTable } from '@/components/admin/cupons/CuponsTable';

export default function AdminCuponsPage() {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold text-[#00173F] font-display">Cupons e Ofertas</h2>
                <p className="text-sm text-slate-500 mt-0.5">Crie e gerencie cupons de desconto, gratuidades e ofertas para assinatura</p>
            </div>
            <CuponsTable />
        </div>
    );
}
