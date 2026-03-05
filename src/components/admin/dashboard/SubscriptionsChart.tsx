'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface SubscriptionsChartProps {
    data: Array<{ mes: string; novas: number; cancelamentos: number }>;
}

export function SubscriptionsChart({ data }: SubscriptionsChartProps) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-[#0B0F1A]">Novas vs Cancelamentos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 0, right: 8, left: 8, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="novas" name="Novas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="cancelamentos" name="Cancelamentos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
