'use client';
import type { ReactNode } from "react";
import { Sidebar } from "@/components/painel/sidebar";
import { Header } from "@/components/painel/header";
import { BottomBar } from "@/components/painel/bottom-bar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UnitProvider } from "@/context/UnitContext";
import { SetupStatusProvider } from "@/context/SetupStatusContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { PendingWorkoutProvider } from "@/context/PendingWorkoutContext";
import { PendingWorkoutsModal } from "@/components/painel/pending-workouts-modal";
import { StatusAutomator } from "@/components/global/status-automator";
import { SetupChecklist } from "@/components/global/setup-checklist";
import { Loader2 } from 'lucide-react';
import { useSubscription } from "@/hooks/useSubscription";
import { PlanFeature } from "@/config/plans";
import { useAuth } from "@/lib/auth/AuthContext";
import { isSuperAdmin } from "@/lib/auth/role-checks";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // SubscriptionProvider must wrap any child that calls useSubscription(),
  // including DashboardLayoutInner itself. This single fetch is shared by
  // all consumers below (sidebar, pages, hooks like useStudentLimit, etc.).
  return (
    <SubscriptionProvider>
      <PendingWorkoutProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </PendingWorkoutProvider>
    </SubscriptionProvider>
  );
}

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, authStatus, retryAuth } = useAuth();
  const { status, hasFeature, loading: subLoading } = useSubscription();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Block ONLY on explicit hard failures — never on PENDING (could be an upgrade in progress).
  // PENDING = new user waiting for first payment (handled by onboarding, not here).
  // CANCELED / PAST_DUE = real access loss.
  const BLOCKING_STATUSES = ['canceled', 'past_due', 'suspended'];
  const isPendingPayment = !!status && BLOCKING_STATUSES.includes(status.toLowerCase());

  useEffect(() => {
    // 1. Wait for auth/profile to finish loading
    if (authStatus === 'checking_auth' || authStatus === 'checking_profile') {
      console.log(`[Route] auth status: ${authStatus}, waiting...`);
      return;
    }

    // 2. Error states — do NOT redirect, let UI show retry
    if (authStatus === 'auth_error' || authStatus === 'profile_error') {
      console.error(`[Route] error state: ${authStatus}`);
      setIsAuthorized(null); // keep showing loading/error UI
      return;
    }

    // 3. No user — redirect to login
    if (authStatus === 'unauthenticated') {
      console.log('[Route] redirect to login');
      setIsAuthorized(false);
      if (!pathname.startsWith('/login')) {
        router.push('/login');
      }
      return;
    }

    // 4. No profile — redirect to onboarding
    if (authStatus === 'profile_missing') {
      if (pathname.startsWith('/app/onboarding')) {
        console.log('[Route] already on onboarding, allowing');
        setIsAuthorized(true);
        return;
      }
      console.log('[Route] redirect to onboarding');
      router.push('/app/onboarding');
      return;
    }

    // 5. profile_found — continue with access checks
    // 👑 SUPER_ADMIN BYPASS: BeeGym staff sempre tem acesso
    const isMasterAdmin = isSuperAdmin(profile?.role as string | undefined);

    if (isMasterAdmin) {
      console.log(`[Route] SUPER_ADMIN recognized: ${user?.email}. Bypassing all checks.`);
      setIsAuthorized(true);
      return;
    }

    // Se o status é pendente e não é master admin, bloqueia tudo
    if (isPendingPayment && !isMasterAdmin && !subLoading) {
       console.log('[Route] hard paywall triggered: user must pay.');
       setIsAuthorized(false);
       router.push('/app/pending-activation');
       return;
    }

    // 6. Proteção de rota dinâmica baseada em feature
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

      console.log(`[Route] route: ${pathname} | feature: ${requiredFeature} | hasAccess: ${hasAccess}`);

      if (!hasAccess) {
        console.warn(`[Route] access denied: ${requiredFeature}. Redirecting to painel.`);
        if (currentRoute !== '/app/painel') {
          router.push('/app/painel');
          return;
        }
      }
    }

    // If we are waiting for subLoading, don't set authorized yet to avoid flicker
    if (currentRoute && subLoading) {
      console.log(`[Route] waiting for subscription features for: ${currentRoute}`);
      return;
    }

    console.log('[Route] allow painel');
    setIsAuthorized(true);
  }, [user, profile, authStatus, subLoading, pathname, router, hasFeature]);

  // Error states — show retry screen, never redirect
  if (authStatus === 'auth_error' || authStatus === 'profile_error') {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-6 text-center">
         <h2 className="text-xl font-bold font-display text-bee-midnight">Erro de Conexão</h2>
         <p className="text-slate-500 font-sans mt-2">Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.</p>
         <button
           onClick={retryAuth}
           className="mt-6 px-6 py-3 bg-bee-amber text-bee-midnight font-bold rounded-full hover:bg-amber-400 transition-colors"
         >
           Tentar Novamente
         </button>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-bee-amber" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-6 text-center">
         <Loader2 className="w-8 h-8 animate-spin text-bee-amber mb-4" />
         <h2 className="text-xl font-bold font-display text-bee-midnight">Acesso Bloqueado</h2>
         <p className="text-slate-500 font-sans mt-2">Você precisa regularizar sua assinatura para acessar o painel. Redirecionando...</p>
      </div>
    );
  }

  const showPendingModal = pathname.startsWith('/app/treinos') || pathname.startsWith('/app/aulas');

  return (
    <UnitProvider>
      <SetupStatusProvider>
        <StatusAutomator />
        {showPendingModal && <PendingWorkoutsModal />}
        <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
          <Sidebar className="flex-shrink-0" />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Header className="flex-shrink-0" />
            <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto overflow-x-hidden pb-24 md:pb-6 relative">
              {children}
            </main>
            <SetupChecklist />
            <BottomBar />
          </div>
        </div>
      </SetupStatusProvider>
    </UnitProvider>
  );
}
