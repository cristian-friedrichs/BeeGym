import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string;
    tooltip?: string;
    variacao?: number;
    variacaoLabel?: string;
    color?: 'green' | 'yellow' | 'red' | 'default' | 'pink' | 'black';
    icon?: React.ReactNode;
}

export function KpiCard({ title, value, tooltip, variacao, variacaoLabel, color = 'default', icon }: KpiCardProps) {
    const isPositive = (variacao ?? 0) >= 0;

    const iconBgMap = {
        green: 'bg-emerald-100 text-emerald-600',
        yellow: 'bg-amber-100 text-amber-600',
        red: 'bg-red-100 text-red-600',
        pink: 'bg-pink-100 text-pink-600',
        black: 'bg-slate-100 text-slate-900',
        default: 'bg-blue-100 text-blue-600',
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', iconBgMap[color])}>
                {icon}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-xs font-semibold text-slate-500 mb-0.5 tracking-tight whitespace-nowrap">{title}</h3>

                <div className="flex items-end justify-between gap-2">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none" title={tooltip}>{value}</h2>

                    {variacao !== undefined && (
                        <div className="flex items-center gap-1 mb-1">
                            {isPositive
                                ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                                : <TrendingDown className="w-3 h-3 text-red-500" />}
                            <span className={cn('text-xs font-bold', isPositive ? 'text-emerald-600' : 'text-red-600')}>
                                {isPositive ? '+' : ''}{variacao}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
