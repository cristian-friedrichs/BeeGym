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
  { icon: LayoutDashboard, label: 'Dashboard', href: '/painel' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: ClipboardList, label: 'Aulas', href: '/aulas', feature: 'aulas_coletivas' },
  { icon: Dumbbell, label: 'Treinos', href: '/treinos' },
  { icon: Users, label: 'Alunos', href: '/alunos' },
  { icon: MessageSquare, label: 'Conversas', href: '/conversas', feature: 'chat' },
  { icon: CreditCard, label: 'Pagamentos', href: '/pagamentos' },
  { icon: Dumbbell, label: 'Exercícios', href: '/exercicios' },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { hasFeature, loading } = useSubscription();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex w-64 border-r bg-card flex-col",
          className
        )}
      >
        <div className="p-6">
          <Link href="/painel">
            <BeeGymLogo size="md" variant="light" />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isLocked = item.feature && !loading && !hasFeature(item.feature);

            if (isLocked) {
              return (
                <button
                  key={item.href}
                  onClick={() => setLockedFeature(item.label)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[8px] font-bold transition-all font-sans uppercase tracking-wider text-[12px] text-slate-400 hover:bg-slate-50 relative group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-[17px] w-[17px] opacity-70" />
                    <span>{item.label}</span>
                  </div>
                  <Lock className="w-[14px] h-[14px] opacity-60 group-hover:text-bee-orange transition-colors" />
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-bold transition-all font-sans uppercase tracking-wider text-[12px]',
                  pathname.startsWith(item.href)
                    ? 'bg-bee-orange text-white shadow-sm'
                    : 'text-slate-500 hover:bg-orange-50 hover:text-bee-orange'
                )}
              >
                <item.icon className="h-[17px] w-[17px]" />
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
