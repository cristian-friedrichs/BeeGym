import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string;
    tooltip?: string;
    variacao?: number;
    variacaoLabel?: string;
    color?: 'green' | 'yellow' | 'red' | 'default' | 'pink' | 'black' | 'amber';
    icon?: React.ReactNode;
    emoji?: string;
}

export function KpiCard({ title, value, tooltip, variacao, variacaoLabel, color = 'default', icon, emoji }: KpiCardProps) {
    const isPositive = (variacao ?? 0) >= 0;

    const iconStyleMap = {
        green: { bg: 'bg-bee-amber', text: 'text-bee-midnight' },
        yellow: { bg: 'bg-bee-amber', text: 'text-bee-midnight' },
        red: { bg: 'bg-bee-amber', text: 'text-bee-midnight' },
        pink: { bg: 'bg-bee-amber', text: 'text-bee-midnight' },
        black: { bg: 'bg-bee-amber', text: 'text-bee-midnight' },
        default: { bg: 'bg-bee-amber', text: 'text-bee-midnight' },
        amber: { bg: 'bg-bee-amber', text: 'text-bee-midnight' },
    };

    const style = iconStyleMap[color];

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 flex items-center gap-4">
            <div className={cn(
                'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
                style.bg, style.text
            )}>
                {emoji ? (
                    <span className="text-2xl">{emoji}</span>
                ) : icon}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap mb-1">
                    {title}
                </p>

                <div className="flex items-end justify-between gap-2">
                    <h2
                        className="text-[28px] font-bold text-[#0B0F1A] tracking-tight leading-none"
                        title={tooltip}
                    >
                        {value}
                    </h2>

                    {variacao !== undefined && (
                        <div className={cn(
                            'flex items-center gap-1 mb-0.5 px-2 py-0.5 rounded-full text-xs font-bold',
                            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        )}>
                            {isPositive
                                ? <TrendingUp className="w-3 h-3" />
                                : <TrendingDown className="w-3 h-3" />}
                            {isPositive ? '+' : ''}{variacao}%
                        </div>
                    )}
                </div>

                {variacaoLabel && (
                    <p className="text-[10px] text-slate-400 mt-1">{variacaoLabel}</p>
                )}
            </div>
        </div>
    );
}
