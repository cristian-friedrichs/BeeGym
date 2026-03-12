'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Construction } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';

export default function PaymentsSettingsPage() {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Pagamentos & Integrações"
                subtitle="Configure seus gateways de pagamento e métodos de recebimento"
            />

            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-bee-amber">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Pagamentos & Integrações</CardTitle>
                        </div>
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
