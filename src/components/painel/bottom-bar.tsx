'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  MessageSquare,
  Dumbbell,
  ClipboardList,
  Lock,
  MoreHorizontal,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import type { PlanFeature } from '@/config/plans';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  feature?: PlanFeature;
}

// Primary tabs — always visible
const primaryItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Home', href: '/app/painel' },
  { icon: Calendar, label: 'Agenda', href: '/app/agenda' },
  { icon: Users, label: 'Alunos', href: '/app/alunos' },
  { icon: Dumbbell, label: 'Treinos', href: '/app/treinos' },
  { icon: ClipboardList, label: 'Aulas', href: '/app/aulas', feature: 'aulas' },
];

// Secondary — inside the "More" sheet
const secondaryItems: MenuItem[] = [
  { icon: MessageSquare, label: 'Conversas', href: '/app/conversas', feature: 'conversas' },
  { icon: CreditCard, label: 'Pagamentos', href: '/app/pagamentos' },
  { icon: Dumbbell, label: 'Exercícios', href: '/app/exercicios' },
  { icon: BarChart3, label: 'Relatórios', href: '/app/relatorios', feature: 'relatorios' },
  { icon: Settings, label: 'Configurações', href: '/app/configuracoes' },
];

export function BottomBar() {
  const pathname = usePathname();
  const { hasFeature, loading } = useSubscription();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  // Hide bottom bar when inside an active conversation (more chat space)
  const insideActiveChat = pathname.startsWith('/app/conversas') && typeof window !== 'undefined' && window.location.search.includes('chat=');

  const isInSecondary = secondaryItems.some(s => pathname.startsWith(s.href));

  const renderTab = (item: MenuItem, isActiveOverride?: boolean) => {
    const isLocked = item.feature && !loading && !hasFeature(item.feature);
    const isActive = isActiveOverride ?? (pathname === item.href || (item.href !== '/app/painel' && pathname.startsWith(item.href)));

    const inner = (
      <>
        <div className={cn(
          'h-9 w-9 rounded-full flex items-center justify-center transition-all',
          isActive ? 'bg-bee-amber/15' : ''
        )}>
          <item.icon
            className={cn('h-5 w-5', isActive ? 'text-bee-amber' : 'text-slate-400')}
          />
          {isLocked && <Lock className="absolute top-1 right-3 w-2.5 h-2.5 text-bee-amber" />}
        </div>
        <span className={cn(
          'text-[10px] font-bold mt-0.5 tracking-tight',
          isActive ? 'text-bee-amber' : 'text-slate-400'
        )}>
          {item.label}
        </span>
      </>
    );

    if (isLocked) {
      return (
        <button
          key={item.href}
          onClick={() => setLockedFeature(item.label)}
          className="relative inline-flex flex-col items-center justify-center pt-1.5 text-center"
        >
          {inner}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className="relative inline-flex flex-col items-center justify-center pt-1.5 text-center"
        onClick={() => setMoreOpen(false)}
      >
        {inner}
      </Link>
    );
  };

  return (
    <>
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 shadow-[0_-2px_15px_rgba(0,0,0,0.06)] z-20 transition-transform",
        insideActiveChat && "translate-y-full"
      )}>
        <div className="grid h-full grid-cols-6">
          {primaryItems.map(item => renderTab(item))}

          {/* More button → opens bottom sheet */}
          <button
            onClick={() => setMoreOpen(true)}
            className="relative inline-flex flex-col items-center justify-center pt-1.5 text-center"
          >
            <div className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center transition-all',
              isInSecondary || moreOpen ? 'bg-bee-amber/15' : ''
            )}>
              <MoreHorizontal className={cn('h-5 w-5', isInSecondary || moreOpen ? 'text-bee-amber' : 'text-slate-400')} />
            </div>
            <span className={cn(
              'text-[10px] font-bold mt-0.5 tracking-tight',
              isInSecondary || moreOpen ? 'text-bee-amber' : 'text-slate-400'
            )}>
              Mais
            </span>
          </button>
        </div>
      </nav>

      {/* ── More bottom sheet ──────────────────────────────────────── */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-150"
          onClick={() => setMoreOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl pb-safe animate-in slide-in-from-bottom duration-200"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-12 bg-slate-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="text-sm font-bold text-slate-800 font-display">Mais opções</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 px-4 pb-6">
              {secondaryItems.map(item => {
                const isLocked = item.feature && !loading && !hasFeature(item.feature);
                const isActive = pathname.startsWith(item.href);

                if (isLocked) {
                  return (
                    <button
                      key={item.href}
                      onClick={() => { setMoreOpen(false); setLockedFeature(item.label); }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50/50 active:scale-95 transition-all relative"
                    >
                      <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 relative">
                        <item.icon className="h-5 w-5 opacity-60" />
                        <Lock className="absolute -top-0.5 -right-0.5 w-3 h-3 text-bee-amber" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 text-center leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-all",
                      isActive ? "bg-bee-amber/10" : "bg-slate-50/50 hover:bg-slate-100/70"
                    )}
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-2xl flex items-center justify-center",
                      isActive ? "bg-bee-amber text-bee-midnight" : "bg-white text-slate-600 shadow-sm"
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold text-center leading-tight",
                      isActive ? "text-bee-amber" : "text-slate-600"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <UpgradePromptModal
        open={!!lockedFeature}
        onOpenChange={(open) => !open && setLockedFeature(null)}
        featureName={lockedFeature || undefined}
      />
    </>
  );
}
