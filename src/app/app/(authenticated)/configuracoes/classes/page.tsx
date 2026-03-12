'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Construction } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';

export default function ClassesSettingsPage() {
    return (
        <div className="space-y-6 flex-1 p-4 md:p-8 pt-6">
            <SectionHeader
                title="Aulas & Modalidades"
                subtitle="Configure as modalidades, horários e templates de aulas da sua academia"
            />

            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-bee-amber">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Configurações de Aulas</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-20 w-20 bg-bee-amber/10 rounded-full flex items-center justify-center mb-6">
                            <Construction className="h-10 w-10 text-bee-amber" />
                        </div>
                        <h3 className="text-xl font-bold text-deep-midnight mb-2">Funcionalidade em Desenvolvimento</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Estamos preparando uma ferramenta completa para você gerenciar templates de aulas, definir categorias e configurar regras automáticas de agendamento.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
