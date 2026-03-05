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

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Home', href: '/app/painel' },
  { icon: Calendar, label: 'Agenda', href: '/app/agenda' },
  { icon: Users, label: 'Alunos', href: '/app/alunos' },
  { icon: MessageSquare, label: 'Conversas', href: '/app/conversas', feature: 'chat' },
  { icon: ClipboardList, label: 'Aulas', href: '/app/aulas', feature: 'aulas_coletivas' },
];

export function BottomBar() {
  const pathname = usePathname();
  const { hasFeature, loading } = useSubscription();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-2xl z-20">
        <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
          {menuItems.map((item) => {
            const isLocked = item.feature && !loading && !hasFeature(item.feature);
            const isActive = pathname === item.href || (item.href !== '/app/painel' && pathname.startsWith(item.href));

            if (isLocked) {
              return (
                <button
                  key={item.href}
                  onClick={() => setLockedFeature(item.label)}
                  className="inline-flex flex-col items-center justify-center pt-2 text-center group"
                >
                  <div className="p-2 rounded-full transition-colors duration-200 group-hover:bg-muted relative">
                    <item.icon className="h-6 w-6 text-muted-foreground opacity-50" />
                    <Lock className="absolute -top-0.5 -right-0.5 w-3 h-3 text-bee-amber" />
                  </div>
                  <span className="text-[11px] font-bold mt-1 tracking-tight text-muted-foreground opacity-50">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex flex-col items-center justify-center pt-2 text-center group"
              >
                <div
                  className={cn(
                    'p-2 rounded-full transition-colors duration-200',
                    isActive ? 'bg-primary/10' : 'group-hover:bg-muted'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-6 w-6',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[11px] font-bold mt-1 tracking-tight',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <UpgradePromptModal
        open={!!lockedFeature}
        onOpenChange={(open) => !open && setLockedFeature(null)}
        featureName={lockedFeature || undefined}
      />
    </>
  );
}
