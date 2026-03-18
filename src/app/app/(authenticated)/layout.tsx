'use client';
import type { ReactNode } from "react";
import { Sidebar } from "@/components/painel/sidebar";
import { Header } from "@/components/painel/header";
import { BottomBar } from "@/components/painel/bottom-bar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UnitProvider } from "@/context/UnitContext";
import { StatusAutomator } from "@/components/global/status-automator";
import { Loader2 } from 'lucide-react';
import { useSubscription } from "@/hooks/useSubscription";
import { PlanFeature } from "@/config/plans";
import { useAuth } from "@/lib/auth/AuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading: authLoading } = useAuth();
  const activeStatuses = ['active', 'trial'];
  const { status, hasFeature, loading: subLoading } = useSubscription();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Hard Blocking logic for payment
  const isPendingPayment = status && !activeStatuses.includes(status.toLowerCase());

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Wait for auth initialization
      if (authLoading) {
        console.log('[AccessCheck] Auth loading, waiting...');
        return;
      }

      if (!user) {
        console.log('[AccessCheck] No user found, setting unauthorized.');
        setIsAuthorized(false);
        if (!pathname.startsWith('/login')) {
          router.push('/login');
        }
        return;
      }

      // 👑 ADMIN BYPASS: Administradores e o e-mail master SEMPRE têm acesso a tudo
      const masterEmail = 'cristian_friedrichs@live.com';
      const userEmail = user?.email?.toLowerCase();
      // Verificamos tanto o profile.role quanto o user.email para garantir o bypass mais rápido possível
      const isAdminByRole = (profile?.role as string) === 'BEEGYM_ADMIN';
      const isMasterAdmin = userEmail === masterEmail || isAdminByRole;

      if (isMasterAdmin) {
        console.log(`[AccessCheck] Admin recognized: ${userEmail} | Role: ${profile?.role}. Bypassing all checks.`);
        setIsAuthorized(true);
        return;
      }

      // Se não é admin master e o profile ainda está carregando, não tomamos decisão abrupta
      if (!profile && !isMasterAdmin) {
        console.log('[AccessCheck] Profile not ready and not master admin, waiting...');
        return;
      }

      // Se o status é pendente e não é master admin, bloqueia tudo
      if (isPendingPayment && !isMasterAdmin && !subLoading) {
         console.log('[AccessCheck] Hard paywall triggered: user must pay.');
         setIsAuthorized(false);
         router.push('/app/pending-activation');
         return;
      }

      // 2. Proteção de rota dinâmica baseada em feature
      // Mapeia o path para a feature correspondente
      const routeFeatureMap: Record<string, PlanFeature> = {
        '/app/painel': 'painel',
        '/app/agenda': 'agenda',
        '/app/aulas': 'aulas',
        '/app/treinos': 'treinos',
        '/app/alunos': 'alunos',
        '/app/conversas': 'conversas',
        '/app/pagamentos': 'pagamentos',
        '/app/exercicios': 'exercicios',
        '/app/relatorios': 'relatorios',
        '/app/configuracoes': 'configuracoes',
      };

      const currentRoute = Object.keys(routeFeatureMap).find(route => pathname.startsWith(route));

      if (currentRoute && !subLoading) {
        const requiredFeature = routeFeatureMap[currentRoute];
        const hasAccess = hasFeature(requiredFeature);

        console.log(`[AccessCheck] Route: ${pathname} | Feature: ${requiredFeature} | HasAccess: ${hasAccess}`);

        if (!hasAccess) {
          console.warn(`[AccessDenied] User lacks feature: ${requiredFeature}. Redirecting to painel.`);
          if (currentRoute !== '/app/painel') {
            router.push('/app/painel');
            return;
          }
        }
      }

      // If we are waiting for subLoading, don't set authorized yet to avoid flicker
      if (currentRoute && subLoading) {
        console.log(`[AccessCheck] Waiting for subscription features for: ${currentRoute}`);
        return;
      }

      setIsAuthorized(true);
    };

    checkAccess();
  }, [user, profile, authLoading, subLoading, pathname, router, hasFeature]);

  if (isAuthorized === null || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-bee-amber" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
         <Loader2 className="w-8 h-8 animate-spin text-bee-amber mb-4" />
         <h2 className="text-xl font-bold font-display text-bee-midnight">Acesso Bloqueado</h2>
         <p className="text-slate-500 font-sans mt-2">Você precisa regularizar sua assinatura para acessar o painel. Redirecionando...</p>
      </div>
    );
  }

  return (
    <UnitProvider>
      <StatusAutomator />
      <div className="flex h-[100dvh] w-full bg-background-light dark:bg-background-dark overflow-hidden">
        <Sidebar className="flex-shrink-0" />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header className="flex-shrink-0" />
          <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto overflow-x-hidden pb-20 md:pb-6 relative">
            {children}
          </main>
          <BottomBar />
        </div>
      </div>
    </UnitProvider>
  );
}
