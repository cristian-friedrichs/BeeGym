'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSync} disabled={loading} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Sincronizar com EFI
            </Button>
            {resultado && (
                <span className={`flex items-center gap-1 text-xs font-bold ${resultado.erros > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {resultado.erros > 0
                        ? <><AlertCircle className="w-3.5 h-3.5" />{resultado.erros} erro(s)</>
                        : <><CheckCircle className="w-3.5 h-3.5" />{resultado.sincronizados} sincronizados</>}
                </span>
            )}
        </div>
    );
}
