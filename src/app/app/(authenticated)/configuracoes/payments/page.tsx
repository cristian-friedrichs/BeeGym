'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Construction } from 'lucide-react';

export default function PaymentsSettingsPage() {
    return (
        <div className="space-y-6">
            <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 text-orange-500">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Pagamentos & Integrações</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">Funcionalidade em Desenvolvimento</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                            Em breve você poderá integrar gateways de pagamento, configurar boletos e definir regras de cobrança.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
