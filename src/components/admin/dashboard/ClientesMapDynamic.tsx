'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const ClientesMap = dynamic(
    () => import('./ClientesMap'),
    {
        ssr: false,
        loading: () => (
            <Card className="rounded-none border-slate-200 shadow-sm h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-slate-900" />
                        Distribuição Geográfica
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative min-h-[400px] flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                        <MapPin className="w-8 h-8 animate-pulse" />
                        <span className="text-sm font-medium uppercase tracking-widest">Carregando Mapa...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }
);

export { ClientesMap as ClientesMapDynamic };
