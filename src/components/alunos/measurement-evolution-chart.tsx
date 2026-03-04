'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronRight } from "lucide-react";
import Link from 'next/link';
import { formatNumber } from '@/lib/formatters';

interface MeasurementEvolutionChartProps {
    data: any[];
    studentId: string;
}

const METRICS = [
    { value: 'weight', label: 'Peso (kg)', color: '#3B82F6' }, // Blue
    { value: 'body_fat', label: 'Gordura (%)', color: '#EF4444' }, // Red
    { value: 'height', label: 'Altura (m)', color: '#10B981' }, // Emerald
];

export function MeasurementEvolutionChart({ data, studentId }: MeasurementEvolutionChartProps) {
    const [selectedMetric, setSelectedMetric] = useState('weight');
    const [timeRange, setTimeRange] = useState('6m');

    const metricConfig = METRICS.find(m => m.value === selectedMetric) || METRICS[0];

    // Filter and format data for chart
    const chartData = data
        .filter(m => m[selectedMetric] !== null && m[selectedMetric] !== undefined)
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
        .map(m => ({
            date: new Date(m.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: m[selectedMetric]
        }));

    return (
        <Card className="rounded-[16px] shadow-sm border-slate-100 overflow-hidden bg-white h-full flex flex-col">
            <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="h-5 w-5 text-orange-500">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Evolução Corporal</CardTitle>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                        <SelectTrigger className="w-[140px] h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                            <SelectValue placeholder="Métrica" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                            {METRICS.map(m => (
                                <SelectItem key={m.value} value={m.value} className="text-[11px] font-medium rounded-lg">{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Link href={`/alunos/${studentId}/measurements`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-6">
                {chartData.length > 1 ? (
                    <div className="h-full w-full min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                    formatter={(value: any) => [`${formatNumber(value, 1)} ${selectedMetric === 'weight' ? 'kg' : selectedMetric === 'body_fat' ? '%' : 'm'}`]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={metricConfig.color}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: metricConfig.color, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <TrendingUp className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium tracking-tight">Dados insuficientes para gerar gráfico.</p>
                        <p className="text-[11px] text-slate-400">Registre pelo menos duas avaliações.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
