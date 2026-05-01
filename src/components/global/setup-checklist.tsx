'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    CheckCircle2, Circle, ChevronDown, ChevronUp,
    Sparkles, Settings, GraduationCap, Wallet, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetupStatus } from '@/context/SetupStatusContext';

interface Step {
    key: string;
    title: string;
    description: string;
    href: string;
    icon: typeof Settings;
    done: boolean;
}

export function SetupChecklist() {
    const pathname = usePathname();
    const { hasBusinessData, hasPlan, hasInstructor, hasStudent, isPrimaryReady, loading } = useSetupStatus();

    // Opens on every page navigation (re-opens when pathname changes)
    const [collapsed, setCollapsed] = useState(false);
    useEffect(() => {
        setCollapsed(false);
    }, [pathname]);

    // Don't render on onboarding routes
    if (pathname?.startsWith('/app/onboarding')) return null;

    // Disappears completely once all 4 steps are done
    if (loading || isPrimaryReady) return null;

    const steps: Step[] = [
        {
            key: 'business',
            title: 'Dados do Negócio',
            description: 'Tipo, nome e horário de funcionamento.',
            href: '/app/configuracoes/general',
            icon: Settings,
            done: hasBusinessData,
        },
        {
            key: 'plan',
            title: 'Crie os Planos',
            description: 'Planos que sua academia oferece aos alunos.',
            href: '/app/configuracoes/plans',
            icon: Wallet,
            done: hasPlan,
        },
        {
            key: 'instructor',
            title: 'Instrutores / Monitores',
            description: 'Cadastre instrutores, monitores e professores.',
            href: '/app/configuracoes/instructors',
            icon: GraduationCap,
            done: hasInstructor,
        },
        {
            key: 'student',
            title: 'Matricule um Aluno',
            description: 'Cadastre e matricule o primeiro aluno.',
            href: '/app/alunos',
            icon: Users,
            done: hasStudent,
        },
    ];

    const completedCount = steps.filter(s => s.done).length;
    const totalSteps = steps.length;
    const progressPct = Math.round((completedCount / totalSteps) * 100);

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[320px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-2xl overflow-hidden border border-bee-amber/30 bg-white">
            {/* Header — always visible, click to toggle */}
            <button
                type="button"
                onClick={() => setCollapsed(c => !c)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-bee-midnight to-slate-900 hover:from-slate-900 hover:to-bee-midnight transition-all text-left"
            >
                <div className="h-8 w-8 rounded-lg bg-bee-amber/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-bee-amber" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white uppercase tracking-wider font-display">
                        Configuração Inicial
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {completedCount} de {totalSteps} etapas concluídas
                    </p>
                </div>

                {/* Progress ring */}
                <div className="relative h-9 w-9 shrink-0">
                    <svg className="rotate-[-90deg]" width="36" height="36" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,191,0,0.15)" strokeWidth="3" />
                        <circle
                            cx="18" cy="18" r="15"
                            fill="none"
                            stroke="#FFBF00"
                            strokeWidth="3"
                            strokeDasharray={`${(progressPct / 100) * 94.25} 94.25`}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-bee-amber">
                        {progressPct}%
                    </span>
                </div>

                {collapsed ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
            </button>

            {/* Steps — collapsible */}
            {!collapsed && (
                <div className="bg-white divide-y divide-slate-50">
                    {steps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isNext = !step.done && steps.slice(0, idx).every(s => s.done);

                        return (
                            <Link
                                key={step.key}
                                href={step.done ? '#' : step.href}
                                onClick={step.done ? (e) => e.preventDefault() : undefined}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 transition-colors',
                                    step.done
                                        ? 'opacity-60 cursor-default bg-emerald-50/40'
                                        : isNext
                                            ? 'hover:bg-bee-amber/5 cursor-pointer'
                                            : 'hover:bg-slate-50 cursor-pointer opacity-70'
                                )}
                            >
                                {/* Step number / check */}
                                <div className={cn(
                                    'h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black border-2',
                                    step.done
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : isNext
                                            ? 'border-bee-amber text-bee-amber'
                                            : 'border-slate-200 text-slate-400'
                                )}>
                                    {step.done ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        <span>{idx + 1}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        'text-xs font-bold leading-none mb-0.5',
                                        step.done ? 'text-emerald-700 line-through' : isNext ? 'text-bee-midnight' : 'text-slate-500'
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 leading-snug">
                                        {step.description}
                                    </p>
                                </div>

                                <StepIcon className={cn(
                                    'h-3.5 w-3.5 shrink-0',
                                    step.done ? 'text-emerald-400' : isNext ? 'text-bee-amber' : 'text-slate-300'
                                )} />
                            </Link>
                        );
                    })}

                    {/* Bottom progress bar */}
                    <div className="px-4 py-2 bg-slate-50/50">
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-bee-amber transition-all duration-700 rounded-full"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
