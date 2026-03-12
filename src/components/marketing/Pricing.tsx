'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Database } from '@/types/supabase';
import { getFeaturesForTier } from '@/lib/marketing/plan-utils';

type SaasPlan = Database['public']['Tables']['saas_plans']['Row'];

interface PricingProps {
    plans: SaasPlan[];
}

export function Pricing({ plans }: PricingProps) {
    // Se não houver planos ativos no BD, renderiza versão de fallback/vazia segura
    if (!plans || plans.length === 0) {
        return null;
    }

    return (
        <section className="py-24 md:py-32 bg-white" id="planos">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-2xl mx-auto mb-20 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-bee-midnight tracking-tight mb-6">
                        Planos sob medida para o seu fitness
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 font-medium">
                        Temos uma estrutura de preços projetada para acompanhar o crescimento do seu negócio.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, idx) => {
                        // Regra visual de destaque: se for o plano do meio (estratégico)
                        const isHighlighted = idx === Math.floor(plans.length / 2);

                        // Tratamento de Promoções nativas do banco
                        const hasPromo = plan.promo_price !== null;
                        const finalPrice = hasPromo ? plan.promo_price : plan.price;

                        // Extrair features dinâmicas com base no tier do banco
                        // Extrair features dinâmicas com base no que foi salvo no banco
                        const dbFeatures = getFeaturesForTier(plan.tier, (plan as any).allowed_features as string[]);

                        // Priorizar os Highlights de Marketing salvos no banco, se existirem
                        const highlights = (plan as any).marketing_highlights && (plan as any).marketing_highlights.length > 0
                            ? (plan as any).marketing_highlights
                            : dbFeatures.map((f: any) => f.name);

                        // Fallback de Subtítulo
                        const subtitle = (plan as any).marketing_subtitle || plan.description || "O plano perfeito para começar a sua gestão fitness profissional.";


                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col p-8 md:p-10 rounded-[2rem] w-full lg:w-1/3 transition-all duration-300 animate-fade-in-up hover:-translate-y-2
                  ${isHighlighted
                                        ? 'bg-bee-midnight text-white shadow-2xl scale-100 lg:scale-105 z-10 border border-bee-midnight'
                                        : 'bg-white text-bee-midnight shadow-xl border border-slate-200'
                                    }`}
                                style={{ animationDelay: `${0.1 * idx}s` }}
                            >
                                {/* Badge Highlight */}
                                {isHighlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-bee-amber text-bee-midnight text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                        Mais Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className={`text-2xl font-bold mb-2 ${isHighlighted ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                                    <p className={`text-sm font-medium h-10 leading-tight ${isHighlighted ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {subtitle}
                                    </p>
                                </div>

                                <div className="mb-8 flex-1">
                                    <div className="flex items-end gap-1 mb-2">
                                        <span className="text-4xl md:text-5xl font-display font-bold tracking-tighter">{finalPrice?.toFixed(2)}</span>
                                        <span className={`text-sm font-medium mb-1 ${isHighlighted ? 'text-slate-400' : 'text-slate-500'}`}>/mês</span>
                                    </div>

                                    {hasPromo && (
                                        <div className="inline-block mt-1">
                                            <span className={`text-sm line-through ${isHighlighted ? 'text-slate-400' : 'text-slate-400'}`}>
                                                {Number(plan.price).toFixed(2)}
                                            </span>
                                            <span className={`text-xs ml-2 font-bold px-2 py-0.5 rounded-md ${isHighlighted ? 'bg-white/10 text-white' : 'bg-coral-red/10 text-coral-red'}`}>
                                                Oferta Válida
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {/* Mostrar limite de alunos primeiro, se existir */}
                                    {(plan as any).max_students ? (
                                        <li className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-brand" />
                                            <span className={`text-sm font-bold ${isHighlighted ? 'text-white' : 'text-bee-midnight'}`}>
                                                Até {(plan as any).max_students} alunos ativos
                                            </span>
                                        </li>
                                    ) : (plan as any).max_students === null ? (
                                        <li className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-brand" />
                                            <span className={`text-sm font-bold ${isHighlighted ? 'text-white' : 'text-bee-midnight'}`}>
                                                Alunos Ilimitados
                                            </span>
                                        </li>
                                    ) : null}

                                    {highlights.map((highlight: string, hIdx: number) => (
                                        <li key={hIdx} className="flex items-center gap-3">
                                            <CheckCircle2 className={`w-5 h-5 shrink-0 ${isHighlighted ? 'text-emerald-brand' : 'text-emerald-brand'}`} />
                                            <span className={`text-sm font-medium ${isHighlighted ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {highlight}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/register" className="mt-auto">
                                    <Button
                                        className={`w-full h-12 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-lg
                      ${isHighlighted
                                                ? 'bg-bee-amber text-bee-midnight'
                                                : 'bg-slate-100 text-bee-midnight'
                                            }`}
                                    >
                                        Começar Agora
                                    </Button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
