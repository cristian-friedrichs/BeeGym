'use client';

import { Check, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Metodo = 'PIX_AUTOMATICO' | 'CARTAO_RECORRENTE';

interface Props {
    value: Metodo;
    onChange: (m: Metodo) => void;
}

const PixIcon = () => (
    <svg viewBox="0 0 512 512" fill="none" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
        <path d="M342.5 154.3c-24.1 0-46.8 9.4-63.8 26.5l-73 73c-5.7 5.7-13.4 9-21.5 9s-15.8-3.2-21.5-9l-73.3-73.3C72.5 163.7 49.7 154.3 25.6 154.3H0v34.3h25.6c14.6 0 28.4 5.7 38.7 16L137.7 278l-73.4 73.4c-10.3 10.3-24 16-38.7 16H0v34.3h25.6c24.1 0 46.8-9.4 63.9-26.5l73.3-73.3c5.7-5.7 13.4-9 21.5-9s15.8 3.2 21.5 9l73 73c17 17.1 39.7 26.5 63.8 26.5h11.3V367h-11.3c-14.6 0-28.4-5.7-38.7-16l-73.4-73.4 73.3-73.3c10.3-10.3 24-16 38.7-16h11.3v-34zM486.4 154.3h-25.6c-24.1 0-46.8 9.4-63.8 26.5l-73 73c-5.7 5.7-13.4 9-21.5 9s-15.8-3.2-21.5-9l-11.5-11.5-24.3 24.3 11.6 11.7c17 17.1 39.7 26.5 63.8 26.5 24.1 0 46.8-9.4 63.8-26.5l73-73c10.3-10.3 24-16 38.7-16h25.6v-34.3zm0 169h-25.6c-14.6 0-28.4-5.7-38.7-16l-73-73c-17-17.1-39.7-26.5-63.8-26.5-11.2 0-22.1 2.1-32.3 6.1l-24.5-24.5c12.7-8.6 27.6-13.3 43.4-13.3 14.6 0 28.4 5.7 38.7 16l73 73c17 17.1 39.7 26.5 63.8 26.5h25.6v34.3z" fill="#FFBF00" />
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
        icon: <CreditCard className="w-8 h-8 text-slate-400" />,
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
                            'relative text-left p-6 rounded-3xl border-2 transition-all focus:outline-none hover:scale-[1.02] active:scale-[0.98]',
                            selected
                                ? 'border-bee-amber bg-amber-50/50 shadow-xl shadow-bee-amber/5'
                                : 'border-slate-100 bg-white hover:border-slate-200'
                        )}
                    >
                        {selected && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-bee-amber rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <Check className="w-3.5 h-3.5 text-bee-midnight weight-black" />
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">{op.icon}</div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-sm text-bee-midnight font-display tracking-tightSmall">{op.label}</span>
                                    {op.badge && (
                                        <span className="text-[9px] font-black px-2 py-0.5 bg-bee-amber/10 text-amber-700 rounded-lg uppercase tracking-widest font-display">
                                            {op.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-tight font-medium">{op.desc}</p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
