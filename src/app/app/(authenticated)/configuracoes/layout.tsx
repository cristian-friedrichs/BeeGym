'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    User,
    Bell,
    Settings,
    Users,
    Shield,
    GraduationCap,
    Building2,
    CreditCard,
    CalendarDays,
    DoorOpen,
    Dumbbell,
    Activity,
    Wallet,
    MessageSquare,
    BarChart3,
    ScrollText,
    Crown,
    Lock,
    LifeBuoy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import { PlanFeature } from '@/config/plans';
import { SectionHeader } from '@/components/ui/section-header';

type MenuItem = {
    label: string;
    href: string;
    icon: any;
    feature?: PlanFeature;
};

const menuItems: MenuItem[] = [
    { label: 'Geral', href: '/app/configuracoes/general', icon: Settings },
    { label: 'Meu Plano', href: '/app/configuracoes/subscription', icon: Crown },
    { label: 'Equipe', href: '/app/configuracoes/team', icon: Users, feature: 'multiplos_usuarios' },
    { label: 'Perfis de Acesso', href: '/app/configuracoes/roles', icon: Shield, feature: 'multiplos_usuarios' },
    { label: 'Unidades', href: '/app/configuracoes/units', icon: Building2, feature: 'multipropriedade' },
    { label: 'Planos', href: '/app/configuracoes/plans', icon: CreditCard, feature: 'automacao_cobranca' },
    { label: 'Salas', href: '/app/configuracoes/rooms', icon: DoorOpen },
    { label: 'Frequência', href: '/app/configuracoes/attendance', icon: Activity },
    { label: 'Financeiro', href: '/app/configuracoes/financial', icon: Wallet, feature: 'automacao_cobranca' },
    { label: 'Suporte', href: '/app/configuracoes/suporte', icon: LifeBuoy },
    { label: 'Logs do Sistema', href: '/app/configuracoes/logs', icon: ScrollText },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { hasFeature, loading } = useSubscription();
    const [lockedFeature, setLockedFeature] = useState<string | null>(null);

    return (
        <div className="flex flex-col h-full overflow-hidden pt-4">

            {/* Main Content with Sidebar */}
            <div className="flex-1 flex gap-0 min-h-0">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 border-r bg-background pr-6 overflow-y-auto pb-8 scrollbar-thin">
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isLocked = item.feature && !loading && !hasFeature(item.feature);
                            const Icon = item.icon;

                            if (isLocked) {
                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => setLockedFeature(item.label)}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-full text-sm font-medium transition-all text-muted-foreground hover:bg-slate-50/50 relative group text-left hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-4 w-4 opacity-70" />
                                            <span>{item.label}</span>
                                        </div>
                                        <Lock className="w-3.5 h-3.5 opacity-60 group-hover:text-bee-amber transition-colors" />
                                    </button>
                                );
                            }

                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-2 rounded-full text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95',
                                        isActive
                                            ? 'bg-bee-amber text-bee-midnight shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="flex-1 pl-8 overflow-y-auto pb-8 scrollbar-thin">
                    {children}
                </main>
            </div>

            <UpgradePromptModal
                open={!!lockedFeature}
                onOpenChange={(open) => !open && setLockedFeature(null)}
                featureName={lockedFeature || undefined}
            />
        </div>
    );
}
