'use client';

import { Check, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Metodo = 'PIX_AUTOMATICO' | 'CARTAO_RECORRENTE';

interface Props {
    value: Metodo;
    onChange: (m: Metodo) => void;
}

const PixIcon = () => (
    <svg viewBox="0 0 512 512" fill="none" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
        <path d="M342.5 154.3c-24.1 0-46.8 9.4-63.8 26.5l-73 73c-5.7 5.7-13.4 9-21.5 9s-15.8-3.2-21.5-9l-73.3-73.3C72.5 163.7 49.7 154.3 25.6 154.3H0v34.3h25.6c14.6 0 28.4 5.7 38.7 16L137.7 278l-73.4 73.4c-10.3 10.3-24 16-38.7 16H0v34.3h25.6c24.1 0 46.8-9.4 63.9-26.5l73.3-73.3c5.7-5.7 13.4-9 21.5-9s15.8 3.2 21.5 9l73 73c17 17.1 39.7 26.5 63.8 26.5h11.3V367h-11.3c-14.6 0-28.4-5.7-38.7-16l-73.4-73.4 73.3-73.3c10.3-10.3 24-16 38.7-16h11.3v-34zM486.4 154.3h-25.6c-24.1 0-46.8 9.4-63.8 26.5l-73 73c-5.7 5.7-13.4 9-21.5 9s-15.8-3.2-21.5-9l-11.5-11.5-24.3 24.3 11.6 11.7c17 17.1 39.7 26.5 63.8 26.5 24.1 0 46.8-9.4 63.8-26.5l73-73c10.3-10.3 24-16 38.7-16h25.6v-34.3zm0 169h-25.6c-14.6 0-28.4-5.7-38.7-16l-73-73c-17-17.1-39.7-26.5-63.8-26.5-11.2 0-22.1 2.1-32.3 6.1l-24.5-24.5c12.7-8.6 27.6-13.3 43.4-13.3 14.6 0 28.4 5.7 38.7 16l73 73c17 17.1 39.7 26.5 63.8 26.5h25.6v34.3z" fill="#32BCAD" />
    </svg>
);

const opcoes: { id: Metodo; label: string; desc: string; badge?: string; icon: React.ReactNode }[] = [
    {
        id: 'PIX_AUTOMATICO',
        label: 'Pix Automático',
        desc: 'Autorize uma única vez no seu banco. Débito automático todo mês.',
        badge: 'Mais usado',
        icon: <PixIcon />,
    },
    {
        id: 'CARTAO_RECORRENTE',
        label: 'Cartão de Crédito',
        desc: 'Cobrança automática mensal no cartão. Aceita Visa, Master, Elo e Amex.',
        icon: <CreditCard className="w-7 h-7 text-slate-500" />,
    },
];

export function MetodoPagamento({ value, onChange }: Props) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {opcoes.map((op) => {
                const selected = value === op.id;
                return (
                    <button
                        key={op.id}
                        type="button"
                        onClick={() => onChange(op.id)}
                        className={cn(
                            'relative text-left p-4 rounded-2xl border-2 transition-all focus:outline-none',
                            selected
                                ? 'border-bee-orange bg-orange-50/60 shadow-sm'
                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                        )}
                    >
                        {selected && (
                            <span className="absolute top-3 right-3 w-5 h-5 bg-bee-orange rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                            </span>
                        )}
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">{op.icon}</div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-[#00173F]">{op.label}</span>
                                    {op.badge && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full uppercase tracking-wide">
                                            {op.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">{op.desc}</p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
