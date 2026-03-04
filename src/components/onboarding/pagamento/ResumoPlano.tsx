'use client';

import { Check } from 'lucide-react';

export interface PlanoInfo {
    id: string;
    name: string;
    tier: string;
    price: number;
    description?: string;
    features: string[];
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${tierBadgeClass[plano.tier] ?? 'bg-slate-100 text-slate-600'}`}>
                        {plano.tier}
                    </span>
                    <h3 className="text-xl font-black font-display text-[#00173F] mt-1.5">{plano.name}</h3>
                </div>
                {!hidePrice && (
                    <div className="text-right flex flex-col items-end">
                        <p className="text-2xl font-black text-bee-orange">{preco}</p>
                        <p className="text-xs text-slate-400 font-medium pb-1 border-b border-transparent">por mês</p>
                        {isPromo && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 border border-emerald-200 shadow-sm leading-tight text-center max-w-[120px]">
                                Promocional por 3 meses
                            </span>
                        )}
                    </div>
                )}
            </div>

            {plano.description && (
                <p className="text-sm text-slate-500">{plano.description}</p>
            )}

            <ul className="space-y-2">
                {plano.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-green-500" />
                        </span>
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}
