'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, Building2, GraduationCap, Wallet, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetupStatus } from '@/context/SetupStatusContext';

const DISMISS_KEY = 'beegym_setup_checklist_dismissed';

interface Step {
    key: 'unit' | 'instructor' | 'plan';
    title: string;
    description: string;
    href: string;
    icon: typeof Building2;
    done: boolean;
}

export function SetupChecklist() {
    const pathname = usePathname();
    const { hasUnit, hasInstructor, hasPlan, isPrimaryReady, loading, isSuperAdminUser } = useSetupStatus();
    const [collapsed, setCollapsed] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Restore dismissed state from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
        }
    }, []);

    // Auto-clear dismissal once setup completes (so user sees it again if a step regresses, e.g. unit deactivated)
    useEffect(() => {
        if (isPrimaryReady && typeof window !== 'undefined') {
            localStorage.removeItem(DISMISS_KEY);
        }
    }, [isPrimaryReady]);

    // Don't render on the onboarding routes themselves
    if (pathname?.startsWith('/app/onboarding')) return null;

    // SUPER_ADMIN accounts bypass setup — they don't have tenant data to fill.
    // Don't show the checklist for them.
    if (isSuperAdminUser) return null;

    // Don't render while loading or when setup is fully done
    if (loading || isPrimaryReady) return null;

    // User chose to hide the banner this session — respect it
    if (dismissed) return null;

    const steps: Step[] = [
        {
            key: 'unit',
            title: 'Cadastre sua unidade',
            description: 'Defina o local onde acontecem aulas e treinos.',
            href: '/app/configuracoes/units',
            icon: Building2,
            done: hasUnit,
        },
        {
            key: 'instructor',
            title: 'Cadastre um instrutor',
            description: 'Adicione um membro com perfil de instrutor pela aba Equipe.',
            href: '/app/configuracoes/team',
            icon: GraduationCap,
            done: hasInstructor,
        },
        {
            key: 'plan',
            title: 'Cadastre um plano',
            description: 'Crie os planos que sua academia oferece aos alunos.',
            href: '/app/configuracoes/plans',
            icon: Wallet,
            done: hasPlan,
        },
    ];

    const completedCount = steps.filter(s => s.done).length;
    const totalSteps = steps.length;
    const progressPct = Math.round((completedCount / totalSteps) * 100);

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, '1');
        setDismissed(true);
    };

    return (
        <div className="rounded-2xl border border-bee-amber/30 bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-sm overflow-hidden mb-4">
            <button
                type="button"
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50/50 transition-colors text-left"
            >
                <div className="h-9 w-9 rounded-xl bg-bee-amber/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-bee-amber" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-bee-midnight font-display">
                        Conclua a configuração inicial
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                        {completedCount} de {totalSteps} etapas concluídas — finalize para criar alunos, aulas e treinos.
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 mr-2">
                    <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-bee-amber transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-bold text-bee-amber tabular-nums">{progressPct}%</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {collapsed ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                    )}
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDismiss(); } }}
                        className="ml-1 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Ocultar até a próxima sessão"
                    >
                        <X className="h-4 w-4" />
                    </span>
                </div>
            </button>

            {!collapsed && (
                <div className="px-4 pb-4 pt-1 grid gap-2 sm:grid-cols-3">
                    {steps.map((step) => {
                        const StepIcon = step.icon;
                        return (
                            <Link
                                key={step.key}
                                href={step.href}
                                className={cn(
                                    'group flex items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-sm',
                                    step.done
                                        ? 'border-emerald-200 bg-emerald-50/50'
                                        : 'border-slate-200 bg-white hover:border-bee-amber/40 hover:bg-amber-50/30'
                                )}
                            >
                                <div className="shrink-0 mt-0.5">
                                    {step.done ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-slate-300 group-hover:text-bee-amber transition-colors" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <StepIcon className={cn('h-3.5 w-3.5 shrink-0', step.done ? 'text-emerald-500' : 'text-slate-400')} />
                                        <p className={cn(
                                            'text-xs font-bold truncate',
                                            step.done ? 'text-emerald-700 line-through' : 'text-bee-midnight'
                                        )}>
                                            {step.title}
                                        </p>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                                        {step.description}
                                    </p>
                                </div>
                                {!step.done && (
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-bee-amber group-hover:translate-x-0.5 transition-all shrink-0" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
