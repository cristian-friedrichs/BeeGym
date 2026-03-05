'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TipoClienteData {
    name: string;
    value: number;
    receita: number;
}

interface TipoClienteChartProps {
    data: TipoClienteData[];
}

const COLORS = ['#0f172a', '#FFBF00', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const RADIAN = Math.PI / 180;

const renderLabel = (dataKey: 'value' | 'receita') => ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null;
};

export function TipoClienteChart({ data }: TipoClienteChartProps) {
    const [viewMode, setViewMode] = useState<'value' | 'receita'>('value');

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const entry = payload[0].payload;
            const val = viewMode === 'receita' ? formatCurrency(entry.receita) : `${entry.value} clientes`;

            return (
                <div className="bg-white border rounded-lg p-3 shadow-md">
                    <p className="font-bold text-slate-800 break-words mb-1">{entry.name}</p>
                    <p className="text-sm font-medium" style={{ color: payload[0].payload.fill }}>
                        {val}
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
                    <p className="text-sm font-bold text-[#0B0F1A]">Tipo de Cliente</p>
                    <p className="text-xs text-slate-400 mt-0.5">Segmentos por tipo de negócio</p>
                </div>
                <Select value={viewMode} onValueChange={(val: 'value' | 'receita') => setViewMode(val)}>
                    <SelectTrigger className="w-[130px] h-7 text-xs font-medium border-slate-200">
                        <SelectValue placeholder="Visualizar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="receita" className="text-xs">Por Receita</SelectItem>
                        <SelectItem value="value" className="text-xs">Por Clientes</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="h-[240px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<CustomTooltip />} />
                        <Pie
                            data={data}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={95}
                            paddingAngle={2}
                            dataKey={viewMode}
                            stroke="none"
                            labelLine={false}
                            label={renderLabel(viewMode)}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="square"
                            wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b', paddingTop: '10px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
