'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PlanData {
    name: string;
    receita: number;
    clientes: number;
}

interface PlanosChartProps {
    data: PlanData[];
}

const PLAN_COLORS: Record<string, string> = {
    'STARTER': '#f59e0b',    // amber-500
    'PLUS': '#3b82f6',       // blue-500
    'STUDIO': '#10b981',     // emerald-500
    'PRO': '#f97316',        // orange-500
    'ENTERPRISE': '#0f172a', // slate-900
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const formatK = (value: number) => {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.', ',').replace(',0', '') + 'M';
    }
    if (value >= 1000) {
        return (value / 1000).toFixed(1).replace('.', ',').replace(',0', '') + 'K';
    }
    return value.toString();
};

export function PlanosChart({ data }: PlanosChartProps) {
    const [viewMode, setViewMode] = useState<'receita' | 'clientes'>('receita');

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const val = payload[0].value;
            const formattedVal = viewMode === 'receita' ? formatCurrency(val) : `${val} clientes`;

            return (
                <div className="bg-white border rounded-lg p-3 shadow-md">
                    <p className="font-bold text-slate-800 break-words mb-1">{label}</p>
                    <p className="text-sm font-medium" style={{ color: payload[0].payload.fill }}>
                        {viewMode === 'receita' ? 'Receita: ' : 'Quantidade: '}
                        {formattedVal}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-[#0B0F1A]">Distribuição por Plano</p>
                    <p className="text-xs text-slate-400 mt-0.5">Receita e clientes por plano</p>
                </div>
                <Select value={viewMode} onValueChange={(val: 'receita' | 'clientes') => setViewMode(val)}>
                    <SelectTrigger className="w-[130px] h-7 text-xs font-medium border-slate-200">
                        <SelectValue placeholder="Visualizar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="receita" className="text-xs">Por Receita</SelectItem>
                        <SelectItem value="clientes" className="text-xs">Por Clientes</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(val) => viewMode === 'receita' ? formatK(val) : val}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar
                            dataKey={viewMode}
                            radius={[0, 0, 0, 0]} // Sharp edges standard
                            maxBarSize={48}
                            animationDuration={1000}
                            animationEasing="ease-out"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.name] || '#94a3b8'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
