'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    ChevronRight,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePromptModal } from '@/components/ui/upgrade-prompt-modal';
import { SectionHeader } from '@/components/ui/section-header';
import type { PlanFeature } from '@/config/plans';

type Item = { label: string; href: string; icon: any; feature?: PlanFeature; description: string };

const items: Item[] = [
    { label: 'Dados do Negócio',  href: '/app/configuracoes/general',      icon: Settings,       description: 'Identidade, horários e contato' },
    { label: 'Meu Plano',         href: '/app/configuracoes/subscription', icon: Crown,          description: 'Assinatura, limites e faturas' },
    { label: 'Equipe',            href: '/app/configuracoes/team',         icon: Users,          feature: 'multiplos_usuarios', description: 'Convide e gerencie usuários' },
    { label: 'Instrutores',       href: '/app/configuracoes/instructors',  icon: GraduationCap,  description: 'Cadastro de instrutores' },
    { label: 'Perfis de Acesso',  href: '/app/configuracoes/roles',        icon: Shield,         feature: 'multiplos_usuarios', description: 'Permissões e funções' },
    { label: 'Planos',            href: '/app/configuracoes/plans',        icon: CreditCard,     description: 'Pacotes vendidos aos alunos' },
    { label: 'Salas',             href: '/app/configuracoes/rooms',        icon: DoorOpen,       feature: 'salas', description: 'Ambientes de treino' },
    { label: 'Suporte',           href: '/app/configuracoes/suporte',      icon: LifeBuoy,       description: 'Fale com nossa equipe' },
    { label: 'Logs do Sistema',   href: '/app/configuracoes/logs',         icon: ScrollText,     description: 'Histórico de ações' },
];

export default function SettingsIndexPage() {
    const router = useRouter();
    const { hasFeature, loading } = useSubscription();
    const [lockedFeature, setLockedFeature] = useState<string | null>(null);

    // Desktop redirects to first item; mobile stays on the menu
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            router.replace('/app/configuracoes/general');
        }
    }, [router]);

    return (
        <div className="md:hidden space-y-3">
            <SectionHeader title="Configurações" subtitle="Personalize seu negócio" />

            <div className="space-y-2">
                {items.map(item => {
                    const isLocked = item.feature && !loading && !hasFeature(item.feature);
                    const Icon = item.icon;

                    const content = (
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0 relative">
                                <Icon className="h-5 w-5" />
                                {isLocked && <Lock className="absolute -top-0.5 -right-0.5 w-3 h-3 text-bee-amber" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800">{item.label}</p>
                                <p className="text-xs text-slate-400 truncate">{item.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                        </div>
                    );

                    return isLocked ? (
                        <button key={item.href} onClick={() => setLockedFeature(item.label)} className="w-full text-left">
                            {content}
                        </button>
                    ) : (
                        <Link key={item.href} href={item.href}>
                            {content}
                        </Link>
                    );
                })}
            </div>

            <UpgradePromptModal
                open={!!lockedFeature}
                onOpenChange={(open) => !open && setLockedFeature(null)}
                featureName={lockedFeature || undefined}
            />
        </div>
    );
}
