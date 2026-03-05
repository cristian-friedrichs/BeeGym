'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
    data: Array<{ mes: string; valor: number }>;
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const formatK = (value: number) => {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.', ',').replace(',0', '') + 'M';
    }
    if (value >= 1000) {
        return (value / 1000).toFixed(1).replace('.', ',').replace(',0', '') + 'K';
    }
    return value.toString();
};

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-[#0B0F1A]">Evolução do MRR</p>
                    <p className="text-xs text-slate-400 mt-0.5">Últimos 12 meses</p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                        <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFBF00" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#FFBF00" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatK(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                        formatter={(v: number) => [formatCurrency(v), 'MRR']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="valor"
                        stroke="#FFBF00"
                        strokeWidth={2.5}
                        fill="url(#mrrGradient)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#FFBF00' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
