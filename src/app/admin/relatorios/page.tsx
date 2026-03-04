import { RelatoriosPanel } from '@/components/admin/relatorios/RelatoriosPanel';

export default function AdminRelatoriosPage() {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold text-[#00173F] font-display">Relatórios</h2>
                <p className="text-sm text-slate-500 mt-0.5">Gere, visualize e exporte relatórios gerenciais do SaaS</p>
            </div>
            <RelatoriosPanel />
        </div>
    );
}
