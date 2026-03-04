'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/admin/dashboard/KpiCard';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { SubscriptionsChart } from '@/components/admin/dashboard/SubscriptionsChart';
import { PlanosChart } from '@/components/admin/dashboard/PlanosChart';
import { TipoClienteChart } from '@/components/admin/dashboard/TipoClienteChart';
import { FaixaAlunosChart } from '@/components/admin/dashboard/FaixaAlunosChart';
import { ClientesMapDynamic } from '@/components/admin/dashboard/ClientesMapDynamic';
import { DollarSign, Users, AlertTriangle, XCircle } from 'lucide-react';

interface DashboardData {
    kpis: {
        mrr: number;
        mrrVariacao: number;
        ativos: number;
        ativosVariacao: number;
        emCarencia: number;
        suspensos: number;
    };
    mrrHistorico: Array<{ mes: string; valor: number }>;
    evolucaoAssinaturas: Array<{ mes: string; novas: number; cancelamentos: number }>;
    planosRateio: Array<{ name: string; receita: number; clientes: number }>;
    tipoClienteRateio: Array<{ name: string; value: number; receita: number }>;
    faixaAlunosRateio: Array<{ faixa: string; clientes: number; receita: number }>;
    mapaClientes: Array<{ id: string; name: string; position: [number, number]; radius: number; clientes: number }>;
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

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            try {
                const response = await fetch('/api/admin/dashboard');

                if (!response.ok) throw new Error('Falha ao carregar dados');

                const result = await response.json();

                if (isMounted) {
                    setData(result);
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted && err.name !== 'AbortError') {
                    console.error('Erro ao buscar dashboard:', err);
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-none p-5 h-28 border border-slate-100" />
                ))}
            </div>
        );
    }

    if (!data) return <p className="text-slate-500">Erro ao carregar dados.</p>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-deep-midnight font-display">Dashboard Admin</h1>
                <p className="text-muted-foreground font-sans mt-1">Visão geral da performance em nível de franqueadora</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="MRR (R$)"
                    value={formatK(data.kpis.mrr)}
                    tooltip={formatCurrency(data.kpis.mrr)}
                    variacao={data.kpis.mrrVariacao}
                    variacaoLabel="vs mês anterior"
                    color="pink"
                    icon={<DollarSign className="h-7 w-7" />}
                />
                <KpiCard
                    title="Ativos"
                    value={String(data.kpis.ativos)}
                    variacao={data.kpis.ativosVariacao}
                    variacaoLabel="vs mês anterior"
                    color="green"
                    icon={<Users className="h-7 w-7" />}
                />
                <KpiCard
                    title="Trial"
                    value={String(data.kpis.emCarencia)}
                    color="default"
                    icon={<AlertTriangle className="h-7 w-7" />}
                />
                <KpiCard
                    title="Churn"
                    value={String(data.kpis.suspensos)}
                    color="black"
                    icon={<XCircle className="h-7 w-7" />}
                />
            </div>

            {/* Linha 1 de Gráficos: Financeiro e Crescimento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={data.mrrHistorico} />
                <SubscriptionsChart data={data.evolucaoAssinaturas} />
            </div>

            {/* Linha 2 de Gráficos: Distribuição */}
            <h2 className="text-xl font-bold tracking-tight text-deep-midnight font-display pt-2">Inteligência de Mercado</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border border-transparent">
                    <PlanosChart data={data.planosRateio} />
                </div>
                <div className="lg:col-span-1">
                    <FaixaAlunosChart data={data.faixaAlunosRateio} />
                </div>
                <div className="lg:col-span-1">
                    <TipoClienteChart data={data.tipoClienteRateio} />
                </div>
            </div>

            {/* Linha 3: Mapa */}
            <div className="grid grid-cols-1 gap-6 min-h-[400px]">
                <ClientesMapDynamic data={data.mapaClientes} />
            </div>
        </div>
    );
}
