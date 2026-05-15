'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Settings,
    Users,
    Shield,
    GraduationCap,
    CreditCard,
    DoorOpen,
    ScrollText,
    Crown,
    Lock,
    LifeBuoy,
    ArrowLeft,
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
    { label: 'Dados do Negócio', href: '/app/configuracoes/general', icon: Settings },
    { label: 'Meu Plano', href: '/app/configuracoes/subscription', icon: Crown },
    { label: 'Equipe', href: '/app/configuracoes/team', icon: Users, feature: 'multiplos_usuarios' },
    { label: 'Instrutores', href: '/app/configuracoes/instructors', icon: GraduationCap },
    { label: 'Perfis de Acesso', href: '/app/configuracoes/roles', icon: Shield, feature: 'multiplos_usuarios' },
    { label: 'Planos', href: '/app/configuracoes/plans', icon: CreditCard },
    { label: 'Salas', href: '/app/configuracoes/rooms', icon: DoorOpen, feature: 'salas' },
    { label: 'Suporte', href: '/app/configuracoes/suporte', icon: LifeBuoy },
    { label: 'Logs do Sistema', href: '/app/configuracoes/logs', icon: ScrollText },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { hasFeature, loading } = useSubscription();
    const [lockedFeature, setLockedFeature] = useState<string | null>(null);

    // Are we on the root /configuracoes (menu page on mobile)?
    const isRoot = pathname === '/app/configuracoes';

    // Find current subpage to show its label in the mobile back-button bar
    const currentItem = menuItems.find(i => pathname.startsWith(i.href));

    return (
        <div className="flex flex-col h-full overflow-hidden pt-2 md:pt-4">

            {/* ── Mobile back bar (only on subpages) ────────────────────────── */}
            {!isRoot && (
                <div className="md:hidden flex items-center gap-2 mb-3 shrink-0">
                    <Link
                        href="/app/configuracoes"
                        className="h-9 w-9 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-600 active:scale-95 transition-all shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1 h-5 bg-bee-amber rounded-full shrink-0" />
                        <h1 className="text-base font-bold text-slate-800 font-display truncate">
                            {currentItem?.label || 'Configurações'}
                        </h1>
                    </div>
                </div>
            )}

            {/* ── Main content with optional sidebar ────────────────────────── */}
            <div className="flex-1 flex gap-0 min-h-0">
                {/* Desktop sidebar */}
                <aside className="hidden md:block w-64 flex-shrink-0 border-r bg-background pr-6 overflow-y-auto pb-8 scrollbar-thin">
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

                {/* Content */}
                <main className="flex-1 md:pl-8 overflow-y-auto pb-8 scrollbar-thin">
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
