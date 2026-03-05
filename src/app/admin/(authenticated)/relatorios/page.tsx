import { RelatoriosPanel } from '@/components/admin/relatorios/RelatoriosPanel';

export default function AdminRelatoriosPage() {
    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                <div>
                    <h2 className="text-base font-bold text-[#0B0F1A] font-display">Relatórios</h2>
                    <p className="text-xs text-slate-400">Gere, visualize e exporte relatórios gerenciais do SaaS</p>
                </div>
            </div>
            <RelatoriosPanel />
        </div>
    );
}
