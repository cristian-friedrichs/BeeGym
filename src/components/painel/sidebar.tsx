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
  Settings,
  BarChart3,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BeeGymLogo } from '@/components/ui/beegym-logo';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import type { PlanFeature } from '@/config/plans';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  feature?: PlanFeature;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/app/painel' },
  { icon: Calendar, label: 'Agenda', href: '/app/agenda' },
  { icon: ClipboardList, label: 'Aulas', href: '/app/aulas', feature: 'aulas_coletivas' },
  { icon: Dumbbell, label: 'Treinos', href: '/app/treinos' },
  { icon: Users, label: 'Alunos', href: '/app/alunos' },
  { icon: MessageSquare, label: 'Conversas', href: '/app/conversas', feature: 'chat' },
  { icon: CreditCard, label: 'Pagamentos', href: '/app/pagamentos' },
  { icon: Dumbbell, label: 'Exercícios', href: '/app/exercicios' },
  { icon: BarChart3, label: 'Relatórios', href: '/app/relatorios' },
  { icon: Settings, label: 'Configurações', href: '/app/configuracoes' },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { hasFeature, loading } = useSubscription();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex w-64 border-r border-[#E2E8F0] bg-white flex-col flex-shrink-0 h-full",
          className
        )}
      >
        <div className="px-5 py-5 flex items-center justify-between">
          <Link href="/app/painel" className="flex items-center gap-2.5">
            <BeeGymLogo size="sm" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto w-full">
          {menuItems.map((item) => {
            const isLocked = item.feature && !loading && !hasFeature(item.feature);
            const isActive = pathname.startsWith(item.href);

            if (isLocked) {
              return (
                <button
                  key={item.href}
                  onClick={() => setLockedFeature(item.label)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 text-slate-500 hover:bg-slate-50 relative group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-[17px] w-[17px] opacity-70 group-hover:text-[#0B0F1A] transition-colors" />
                    <span className="group-hover:text-[#0B0F1A] transition-colors">{item.label}</span>
                  </div>
                  <Lock className="w-[14px] h-[14px] opacity-60 group-hover:text-bee-amber transition-colors" />
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-[#0B0F1A] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#0B0F1A]'
                )}
              >
                <item.icon className={cn("h-[17px] w-[17px] transition-colors", isActive ? "text-[#FFBF00]" : "group-hover:text-[#0B0F1A]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <UpgradePromptModal
        open={!!lockedFeature}
        onOpenChange={(open) => !open && setLockedFeature(null)}
        featureName={lockedFeature || undefined}
      />
    </>
  );
}
