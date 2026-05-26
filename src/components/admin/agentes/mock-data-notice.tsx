import { Info } from 'lucide-react';
import { commandCenterPhaseNotice } from '@/lib/admin/agent-command-center-data';

export function MockDataNotice() {
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs font-bold text-amber-700 shadow-sm">
            <Info className="h-4 w-4 shrink-0" />
            <span>{commandCenterPhaseNotice}</span>
            <span className="text-amber-600/80">Sem Supabase, sem API nova, sem GitHub real e sem acoes reais.</span>
        </div>
    );
}
