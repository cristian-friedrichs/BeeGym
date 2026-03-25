'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { Database } from '@/types/supabase';
import { getFeaturesForTier } from '@/lib/marketing/plan-utils';

type SaasPlan = Database['public']['Tables']['saas_plans']['Row'];

interface PricingProps {
    plans: SaasPlan[];
    showHeader?: boolean;
}

export function Pricing({ plans, showHeader = true }: PricingProps) {
    if (!plans || plans.length === 0) return null;

    return (
        <section id="planos" className={`${showHeader ? 'py-28 md:py-36' : 'pt-12 pb-0'} bg-[#0B0F1A] relative overflow-hidden`}>
            {/* Amber bleed center */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bee-amber/30 to-transparent" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[600px] bg-bee-amber/5 blur-[160px] pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12 relative z-10">
                {showHeader && (
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">Planos</p>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.05] tracking-tight mb-6">
                            Preço simples. Valor real.
                        </h2>
                        <p className="text-slate-400 font-medium text-lg">
                            Escolha o plano que acompanha o tamanho do seu negócio.
                        </p>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row items-stretch justify-center gap-px bg-white/5 border border-white/5 max-w-5xl mx-auto">
                    {plans.map((plan, idx) => {
                        const isHighlighted = idx === Math.floor(plans.length / 2);
                        const hasPromo = plan.promo_price !== null;
                        const finalPrice = hasPromo ? plan.promo_price : plan.price;
                        const dbFeatures = getFeaturesForTier(plan.tier, (plan as any).allowed_features as string[]);
                        const highlights = (plan as any).marketing_highlights?.length > 0
                            ? (plan as any).marketing_highlights
                            : dbFeatures.map((f: any) => f.name);
                        const subtitle = (plan as any).marketing_subtitle || plan.description || '';

                        return (
                            <div
                                key={plan.id}
                                id={`plan-${plan.tier}`}
                                className={`relative flex flex-col w-full lg:w-1/3 p-8 md:p-10 transition-all duration-300 ${
                                    isHighlighted
                                        ? 'bg-bee-amber text-bee-midnight'
                                        : 'bg-[#0B0F1A] text-white hover:bg-white/3'
                                }`}
                            >
                                {/* Popular badge */}
                                {isHighlighted && (
                                    <div className="absolute -top-3 left-8 bg-bee-midnight text-bee-amber text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1">
                                        Mais popular
                                    </div>
                                )}

                                {/* Plan name */}
                                <div className="mb-8">
                                    <h3 className={`text-xl font-bold mb-1 tracking-tight ${isHighlighted ? 'text-bee-midnight' : 'text-white'}`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`text-sm font-medium ${isHighlighted ? 'text-bee-midnight/60' : 'text-slate-500'}`}>
                                        {subtitle}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-end gap-1">
                                        <span className={`text-5xl font-display font-bold tracking-tight ${isHighlighted ? 'text-bee-midnight' : 'text-white'}`}>
                                            R$ {Number(finalPrice).toFixed(2).replace('.', ',')}
                                        </span>
                                        <span className={`text-sm font-medium mb-1.5 ${isHighlighted ? 'text-bee-midnight/60' : 'text-slate-500'}`}>
                                            /mês
                                        </span>
                                    </div>
                                    {hasPromo && (
                                        <p className={`text-sm line-through mt-1 ${isHighlighted ? 'text-bee-midnight/40' : 'text-slate-600'}`}>
                                            R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-10 flex-1">
                                    {(plan as any).max_students != null && (
                                        <li className="flex items-center gap-3">
                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-bee-midnight' : 'text-bee-amber'}`} />
                                            <span className={`text-sm font-bold ${isHighlighted ? 'text-bee-midnight' : 'text-white'}`}>
                                                {(plan as any).max_students ? `Até ${(plan as any).max_students} alunos` : 'Alunos ilimitados'}
                                            </span>
                                        </li>
                                    )}
                                    {dbFeatures.map((f: any, hi: number) => (
                                        <li key={hi} className="flex items-center gap-3">
                                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-bee-midnight' : 'text-bee-amber'}`} />
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${isHighlighted ? 'text-bee-midnight/80' : 'text-slate-400'}`}>
                                                    {f.name}
                                                </span>
                                                {f.upcoming && (
                                                    <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 border ${
                                                        isHighlighted 
                                                            ? 'text-bee-midnight border-bee-midnight/20 bg-bee-midnight/5' 
                                                            : 'text-bee-amber border-bee-amber/20 bg-bee-amber/10'
                                                    }`}>
                                                        Breve
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/register" className="mt-auto">
                                    <Button
                                        id={`plan-cta-${plan.tier}`}
                                        className={`w-full h-12 rounded-full font-bold text-sm tracking-widest uppercase transition-all hover:-translate-y-0.5 ${
                                            isHighlighted
                                                ? 'bg-bee-midnight text-white hover:bg-bee-midnight/90'
                                                : 'bg-bee-amber text-bee-midnight hover:bg-[#E67E22]'
                                        }`}
                                    >
                                        Começar agora
                                    </Button>
                                </Link>
                            </div>
                        );
                    })}
                </div>

                <p className="text-center text-slate-600 text-sm mt-8 font-medium">
                    Todos os planos incluem 7 dias de teste · Sem necessidade de cartão de crédito
                </p>
            </div>
        </section>
    );
}
