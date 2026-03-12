'use client';

import { ActiveSessionBanner } from '@/components/painel/active-session-banner';
import { UpcomingActivities } from '@/components/painel/upcoming-activities';
import { ImportantAlerts } from '@/components/painel/important-alerts';
import { ActivitiesChart } from '@/components/painel/activities-chart';
import { KpiCards } from '@/components/painel/kpi-cards';
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { createClient } from '@/lib/supabase/client';
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Settings } from "lucide-react";

import { SectionHeader } from '@/components/ui/section-header';

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
    <div className="space-y-6">
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[1.5rem] border-slate-100 shadow-2xl">
          <DialogHeader className="p-6 border-b text-left sm:text-left flex flex-row items-center gap-4 bg-white shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bee-amber/10 shrink-0">
              <Sparkles className="h-6 w-6 text-bee-amber" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900 leading-none font-display">
                Bem-vindo ao BeeGym!
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-sm">
                Sua jornada começa agora, {userName}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <p className="text-slate-600 font-sans text-base leading-relaxed max-w-[340px]">
              Obrigado por escolher o BeeGym para gerenciar seus treinos e saúde. Estamos felizes em ter você conosco!
            </p>

            <div className="w-full grid grid-cols-1 gap-3 pt-2">
              <Link href="/app/configuracoes/general" onClick={() => handleCloseWelcome(true)} className="block w-full">
                <Button className="w-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold h-12 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                  <Settings className="w-5 h-5" />
                  Ir para Configurações
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => handleCloseWelcome(false)}
                className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold h-11 rounded-full transition-all"
              >
                Agora Não
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      <ActiveSessionBanner />

      <div>
        <SectionHeader title="Visão Geral" subtitle="Métricas de assinantes e desempenho financeiro" />
        <div className="mt-4">
          <KpiCards />
        </div>
      </div>

      {/* MAIN GRID: Esquerda (Listas + Gráfico) | Direita (Alertas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUNA ESQUERDA (2/3 da tela) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Próximas Atividades */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                <h3 className="text-base font-bold text-[#0B0F1A] font-display">Próximas Atividades</h3>
              </div>
              <Link href="/agenda?view=day">
                <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 font-bold text-[11px] uppercase tracking-widest text-slate-500 hover:text-orange-600 hover:bg-amber-50 transition-all rounded-full hover:-translate-y-0.5 active:scale-95">
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
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
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
