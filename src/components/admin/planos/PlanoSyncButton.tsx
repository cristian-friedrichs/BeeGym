'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function PlanoSyncButton() {
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<{ sincronizados: number; erros: number } | null>(null);
    const { toast } = useToast();

    const handleSync = async () => {
        setLoading(true);
        setResultado(null);
        try {
            const res = await fetch('/api/admin/planos/sync', { method: 'POST' });
            const data = await res.json();
            setResultado(data);
            toast({
                title: `Sync concluído: ${data.sincronizados} planos sincronizados${data.erros > 0 ? `, ${data.erros} erro(s)` : ''}`,
            });
        } catch {
            toast({ title: 'Erro ao sincronizar com a EFI', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                onClick={handleSync}
                disabled={loading}
                className="h-11 px-6 rounded-2xl border-slate-200 text-slate-500 font-bold hover:bg-amber-50 hover:text-bee-amber hover:border-amber-100 transition-all gap-2"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Sincronizar com EFI
            </Button>
            {resultado && (
                <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all animate-in fade-in slide-in-from-left-2",
                    resultado.erros > 0
                        ? 'bg-red-50 border-red-100 text-red-600'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                )}>
                    {resultado.erros > 0
                        ? <><AlertCircle className="w-4 h-4" /><span className="text-[11px] font-black uppercase tracking-widest">{resultado.erros} erro(s)</span></>
                        : <><CheckCircle className="w-4 h-4" /><span className="text-[11px] font-black uppercase tracking-widest">{resultado.sincronizados} sincronizados</span></>}
                </div>
            )}
        </div>
    );
}
