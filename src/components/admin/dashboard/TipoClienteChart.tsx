'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TipoClienteData {
    name: string;
    value: number;
    receita: number;
}

interface TipoClienteChartProps {
    data: TipoClienteData[];
}

const COLORS = ['#0f172a', '#ff8c00', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

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
        <Card className="rounded-2xl border-slate-100 shadow-sm h-full p-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold text-slate-800 tracking-tight">
                    Tipo de Cliente
                </CardTitle>
                <Select value={viewMode} onValueChange={(val: 'value' | 'receita') => setViewMode(val)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs font-medium border-slate-200">
                        <SelectValue placeholder="Visualizar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="receita" className="text-xs">Por Receita (R$)</SelectItem>
                        <SelectItem value="value" className="text-xs">Por Clientes (Qtd)</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full mt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={data}
                                cx="50%" cy="50%"
                                innerRadius={50} outerRadius={110}
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
            </CardContent>
        </Card>
    );
}
