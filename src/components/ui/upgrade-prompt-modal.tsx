'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Crown, Lock, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { BEEGYM_PLANS } from "@/config/plans";

// Which plan first unlocks each feature
const FEATURE_MIN_PLAN: Record<string, string> = {
    multiplos_usuarios: 'plan_studio',
    salas:              'plan_studio',
    aulas:              'plan_studio',
    conversas:          'plan_studio',
    app_aluno:          'plan_studio',
    multiplos_agendamentos: 'plan_studio',
    automacao_cobranca: 'plan_pro',
    crm:                'plan_pro',
    relatorios:         'plan_pro',
    multipropriedade:   'plan_enterprise',
    api_externa:        'plan_enterprise',
    api_acesso:         'plan_enterprise',
    alertas:            'plan_enterprise',
    white_label:        'plan_enterprise',
};

// Human-readable feature → plan name lookup
function getMinPlanForFeature(featureName?: string): { planName: string; planId: string; kiwifyLink?: string } | null {
    if (!featureName) return null;

    // Try to match by label (e.g. "Equipe" → multiplos_usuarios)
    const labelToFeature: Record<string, string> = {
        'Equipe':            'multiplos_usuarios',
        'Perfis de Acesso':  'multiplos_usuarios',
        'Salas':             'salas',
        'Aulas':             'aulas',
        'Conversas':         'conversas',
        'Relatórios':        'relatorios',
        'Financeiro':        'automacao_cobranca',
    };

    const feature = labelToFeature[featureName] ?? featureName;
    const planId = FEATURE_MIN_PLAN[feature];
    if (!planId) return null;

    const plan = BEEGYM_PLANS[planId];
    return { planName: plan.name, planId, kiwifyLink: plan.kiwify_link };
}

interface UpgradePromptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    featureName?: string;
}

export function UpgradePromptModal({ open, onOpenChange, featureName }: UpgradePromptModalProps) {
    const router = useRouter();
    const { plan: currentPlan } = useSubscription();
    const minPlan = getMinPlanForFeature(featureName);

    const handleUpgrade = () => {
        onOpenChange(false);
        router.push('/app/configuracoes/subscription');
    };

    // Bullet points of the minimum unlocking plan
    const planBenefits = minPlan ? BEEGYM_PLANS[minPlan.planId]?.featuresList?.slice(0, 3) ?? [] : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                {/* Header */}
                <DialogHeader className="px-7 pt-7 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-bee-amber/15 border border-bee-amber/25 flex items-center justify-center shrink-0">
                            <Lock className="h-5 w-5 text-bee-amber" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-black font-display text-slate-900 leading-tight">
                                {featureName
                                    ? <>Recurso bloqueado</>
                                    : <>Funcionalidade bloqueada</>
                                }
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                {minPlan
                                    ? <>Disponível a partir do plano <span className="font-bold text-bee-amber">{minPlan.planName}</span></>
                                    : <>Faça upgrade para liberar</>
                                }
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="px-7 py-5 space-y-5">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {featureName
                            ? <><span className="font-bold text-slate-800">{featureName}</span> não está disponível no plano <span className="font-semibold">{currentPlan?.name}</span>.</>
                            : <>Esta funcionalidade não está disponível no seu plano atual.</>
                        }
                    </p>

                    {planBenefits.length > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Plano {minPlan?.planName} inclui:
                            </p>
                            {planBenefits.map((b, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    {b}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2 pt-1">
                        <button
                            onClick={handleUpgrade}
                            className="w-full h-11 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold text-sm rounded-full flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm"
                        >
                            <Crown className="h-4 w-4" />
                            Ver planos e fazer upgrade
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="w-full h-10 text-slate-400 hover:text-slate-600 text-sm font-semibold rounded-full transition-colors"
                        >
                            Agora não
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
