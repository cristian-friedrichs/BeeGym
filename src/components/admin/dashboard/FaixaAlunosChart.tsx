'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FaixaData {
    faixa: string;
    clientes: number;
    receita: number;
}

interface FaixaAlunosChartProps {
    data: FaixaData[];
}

const BAR_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#f97316', '#0f172a'];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatK = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1).replace('.', ',').replace(',0', '') + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1).replace('.', ',').replace(',0', '') + 'K';
    return value.toString();
};

export function FaixaAlunosChart({ data }: FaixaAlunosChartProps) {
    const [viewMode, setViewMode] = useState<'clientes' | 'receita'>('clientes');

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const val = payload[0].value;
            const formatted = viewMode === 'receita' ? formatCurrency(val) : `${val} clientes`;

            return (
                <div className="bg-white border rounded-lg p-3 shadow-md">
                    <p className="font-bold text-slate-800 break-words mb-1">Porte: {label} alunos</p>
                    <p className="text-sm font-medium" style={{ color: payload[0].payload.fill }}>
                        {viewMode === 'receita' ? 'Receita: ' : 'Quantidade: '}{formatted}
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
                    <p className="text-sm font-bold text-[#0B0F1A]">Porte de Academia</p>
                    <p className="text-xs text-slate-400 mt-0.5">Distribuição por número de alunos</p>
                </div>
                <Select value={viewMode} onValueChange={(val: 'clientes' | 'receita') => setViewMode(val)}>
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="faixa"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#94a3b8' }}
                            tickFormatter={(val) => viewMode === 'receita' ? formatK(val) : val}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey={viewMode} radius={[4, 4, 0, 0]} barSize={40}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
