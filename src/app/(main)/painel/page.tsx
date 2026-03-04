'use client';

import { ActiveSessionBanner } from '@/components/painel/active-session-banner';
import { UpcomingActivities } from '@/components/painel/upcoming-activities';
import { ImportantAlerts } from '@/components/painel/important-alerts';
import { ActivitiesChart } from '@/components/painel/activities-chart';
import { KpiCards } from '@/components/painel/kpi-cards';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Welcome Logic
    const welcomeSeen = localStorage.getItem('beegym_welcome_seen');
    if (!welcomeSeen) {
      const getUser = async () => {
        const { data } = await createClient().auth.getUser();
        if (data.user) {
          setUserName(data.user.user_metadata?.full_name?.split(' ')[0] || '');
          setShowWelcome(true);
        }
      };
      getUser();
    }
  }, []);

  const handleCloseWelcome = (goToSettings: boolean) => {
    setShowWelcome(false);
    localStorage.setItem('beegym_welcome_seen', 'true');
  };

  return (
    <div className="space-y-8">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#00173F]">Bem-vindo ao BeeGym! 🚀</DialogTitle>
            <DialogDescription className="pt-2">
              Obrigado por escolher o BeeGym <span className="font-bold text-[#00173F]">{userName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => handleCloseWelcome(false)}>Agora Não</Button>
            <Link href="/configuracoes" onClick={() => handleCloseWelcome(true)}>
              <Button className="bg-[#ff8c00] hover:bg-[#e67e00] text-white font-bold">Configurar</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-deep-midnight font-display">Dashboard</h1>
        <p className="text-muted-foreground font-sans mt-1">Visão geral das suas atividades</p>
      </div>

      <ActiveSessionBanner />

      {/* KPIS (Visual restaurado com dados reais) */}
      <KpiCards />

      {/* MAIN GRID: Esquerda (Listas + Gráfico) | Direita (Alertas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUNA ESQUERDA (2/3 da tela) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Próximas Atividades */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" /><path d="M2 20h20" /><path d="M14 12v.01" /></svg>
                </div>
                <h3 className="text-lg font-bold text-deep-midnight tracking-tight font-display">Atividades do Dia</h3>
              </div>
              <Link href="/agenda?view=day">
                <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 font-bold text-[11px] uppercase tracking-widest text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-[10px]">
                  Ver Tudo
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </Button>
              </Link>
            </div>
            <div className="p-6">
              <UpcomingActivities />
            </div>
          </div>

          {/* Gráfico de Treinos por Dia */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
            <ActivitiesChart />
          </div>
        </div>

        {/* COLUNA DIREITA (1/3 da tela) */}
        <div className="lg:col-span-1">
          <ImportantAlerts />
        </div>
      </div>
    </div>
  );
}
