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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import { PlanFeature } from '@/config/plans';

type MenuItem = {
    label: string;
    href: string;
    icon: any;
    feature?: PlanFeature;
};

const menuItems: MenuItem[] = [
    { label: 'Geral', href: '/configuracoes/general', icon: Settings },
    { label: 'Meu Plano', href: '/configuracoes/subscription', icon: Crown },
    { label: 'Equipe', href: '/configuracoes/team', icon: Users, feature: 'multiplos_usuarios' },
    { label: 'Perfis de Acesso', href: '/configuracoes/roles', icon: Shield, feature: 'multiplos_usuarios' },
    { label: 'Unidades', href: '/configuracoes/units', icon: Building2, feature: 'multipropriedade' },
    { label: 'Planos', href: '/configuracoes/plans', icon: CreditCard, feature: 'cobranca_automatizada' },
    { label: 'Salas', href: '/configuracoes/rooms', icon: DoorOpen },
    { label: 'Frequência', href: '/configuracoes/attendance', icon: Activity },
    { label: 'Financeiro', href: '/configuracoes/financial', icon: Wallet, feature: 'cobranca_automatizada' },
    { label: 'Logs do Sistema', href: '/configuracoes/logs', icon: ScrollText },
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
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="mb-6 flex-shrink-0">
                <h2 className="text-3xl font-bold tracking-tight text-[#00173F]">Configurações</h2>
                <p className="text-muted-foreground">Gerencie as preferências da sua conta e do aplicativo.</p>
            </div>

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
                                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-slate-50 relative group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-4 w-4 opacity-70" />
                                            <span>{item.label}</span>
                                        </div>
                                        <Lock className="w-3.5 h-3.5 opacity-60 group-hover:text-bee-orange transition-colors" />
                                    </button>
                                );
                            }

                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
