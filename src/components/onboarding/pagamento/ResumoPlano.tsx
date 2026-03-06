'use client';

import { Check } from 'lucide-react';

export interface PlanoInfo {
    id: string;
    name: string;
    tier: string;
    price: number;
    description?: string;
    features: string[];
    promo_price?: number | null;
    promo_months?: number | null;
}

const tierBadgeClass: Record<string, string> = {
    STARTER: 'bg-amber-100 text-amber-700',
    PLUS: 'bg-blue-100 text-blue-700',
    STUDIO: 'bg-teal-100 text-teal-700',
    PRO: 'bg-slate-100 text-slate-700',
    ENTERPRISE: 'bg-orange-100 text-orange-700',
};

interface Props {
    plano: PlanoInfo;
    hidePrice?: boolean;
    isPromo?: boolean;
}

export function ResumoPlano({ plano, hidePrice, isPromo }: Props) {
    const preco = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(plano.price);

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] ${tierBadgeClass[plano.tier] ?? 'bg-slate-100 text-slate-600'} font-display`}>
                        {plano.tier}
                    </span>
                    <h3 className="text-2xl font-black font-display text-bee-midnight mt-2 tracking-tight">{plano.name}</h3>
                </div>
                {!hidePrice && (
                    <div className="text-right flex flex-col items-end">
                        {plano.promo_price ? (
                            <>
                                <p className="text-sm font-bold text-slate-400 font-display tracking-tighter line-through mb-[-4px]">
                                    {preco}
                                </p>
                                <p className="text-3xl font-black text-emerald-600 font-display tracking-tighter">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.promo_price)}
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter ml-1">/mês</span>
                                </p>
                            </>
                        ) : (
                            <p className="text-3xl font-black text-bee-midnight font-display tracking-tighter">
                                {preco}
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter ml-1">/mês</span>
                            </p>
                        )}
                        {(isPromo || plano.promo_months) && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 border border-emerald-200 shadow-sm leading-tight text-center max-w-[120px]">
                                Promocional por {plano.promo_months || 3} {plano.promo_months === 1 ? 'mês' : 'meses'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {plano.description && (
                <p className="text-sm text-slate-500">{plano.description}</p>
            )}

            <ul className="space-y-3 pt-2 border-t border-slate-50">
                {plano.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                        <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-bee-amber stroke-[3px]" />
                        </div>
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}
