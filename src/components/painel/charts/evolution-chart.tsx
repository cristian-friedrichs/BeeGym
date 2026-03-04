'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { EvolutionDataPoint, EvolutionMetric } from '@/services/supabase/student-profile';

type EvolutionChartProps = {
    data: EvolutionDataPoint[];
    selectedMetric: EvolutionMetric;
    onMetricChange: (metric: EvolutionMetric) => void;
    isLoading?: boolean;
};

const metricLabels: Record<EvolutionMetric, string> = {
    weight: 'Peso (kg)',
    bmi: 'IMC',
    body_fat: '% Gordura',
    muscle_mass: 'Massa Muscular (kg)',
};

const metricColors: Record<EvolutionMetric, string> = {
    weight: 'hsl(var(--primary))',
    bmi: '#3B82F6',
    body_fat: '#EF4444',
    muscle_mass: '#10B981',
};

export function EvolutionChart({ data, selectedMetric, onMetricChange, isLoading }: EvolutionChartProps) {
    const chartColor = metricColors[selectedMetric];

    const formattedData = useMemo(() => {
        return data.map((point) => ({
            ...point,
            displayValue: point.value.toFixed(1),
        }));
    }, [data]);

    return (
        <Card className="shadow-soft rounded-3xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-3">
                            <TrendingUp className="text-primary h-5 w-5" />
                            Evolução de Medidas
                        </CardTitle>
                        <CardDescription>Acompanhe o progresso das medidas corporais.</CardDescription>
                    </div>
                    <Select value={selectedMetric} onValueChange={(value) => onMetricChange(value as EvolutionMetric)}>
                        <SelectTrigger className="w-[180px] h-10 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-lg focus:ring-1 focus:ring-orange-200 transition-all hover:border-slate-200">
                            <SelectValue placeholder="Selecionar Medida" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(metricLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Nenhum dado de evolução disponível.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={formattedData}>
                            <defs>
                                <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.toFixed(0)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value: number) => [value.toFixed(1), metricLabels[selectedMetric]]}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={chartColor}
                                strokeWidth={2}
                                fill={`url(#gradient-${selectedMetric})`}
                                dot={{ r: 4, fill: chartColor, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                                activeDot={{ r: 6, fill: chartColor }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
