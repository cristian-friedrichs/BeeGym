'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/ui/kpi-card';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { SubscriptionsChart } from '@/components/admin/dashboard/SubscriptionsChart';
import { PlanosChart } from '@/components/admin/dashboard/PlanosChart';
import { TipoClienteChart } from '@/components/admin/dashboard/TipoClienteChart';
import { FaixaAlunosChart } from '@/components/admin/dashboard/FaixaAlunosChart';
import { ClientesMapDynamic } from '@/components/admin/dashboard/ClientesMapDynamic';
import { DollarSign, Users, AlertTriangle, XCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';

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

import { formatK, formatCurrencyK, formatCurrency } from '@/lib/formatters';

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
                if (isMounted) {
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
            <div className="space-y-8 pb-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 h-28 border border-slate-100" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
                    <div className="bg-white rounded-2xl h-72 border border-slate-100" />
                    <div className="bg-white rounded-2xl h-72 border border-slate-100" />
                </div>
            </div>
        );
    }

    if (!data) return <p className="text-slate-500">Erro ao carregar dados.</p>;

    return (
        <div className="space-y-8 pb-12">
            {/* KPIs */}
            <section className="space-y-4">
                <SectionHeader title="Visão Geral" subtitle="Performance financeira e de clientes do mês atual" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="MRR"
                        value={formatCurrencyK(data.kpis.mrr)}
                        tooltip={formatCurrency(data.kpis.mrr)}
                        variacao={data.kpis.mrrVariacao}
                        variacaoLabel="vs mês anterior"
                        color="amber"
                        icon={<DollarSign className="h-6 w-6" />}
                    />
                    <KpiCard
                        title="Assinantes Ativos"
                        value={String(data.kpis.ativos)}
                        variacao={data.kpis.ativosVariacao}
                        variacaoLabel="vs mês anterior"
                        color="green"
                        icon={<Users className="h-6 w-6" />}
                    />
                    <KpiCard
                        title="Em Trial"
                        value={String(data.kpis.emCarencia)}
                        color="default"
                        icon={<AlertTriangle className="h-6 w-6" />}
                    />
                    <KpiCard
                        title="Churn"
                        value={String(data.kpis.suspensos)}
                        color="black"
                        icon={<XCircle className="h-6 w-6" />}
                    />
                </div>
            </section>

            {/* Gráficos: Financeiro e Crescimento */}
            <section className="space-y-4">
                <SectionHeader title="Performance Financeira" subtitle="Evolução do MRR e base de assinantes" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <RevenueChart data={data.mrrHistorico} />
                    <SubscriptionsChart data={data.evolucaoAssinaturas} />
                </div>
            </section>

            {/* Inteligência de Mercado */}
            <section className="space-y-4">
                <SectionHeader title="Inteligência de Mercado" subtitle="Distribuição de clientes, planos e perfil de academia" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <PlanosChart data={data.planosRateio} />
                    <FaixaAlunosChart data={data.faixaAlunosRateio} />
                    <TipoClienteChart data={data.tipoClienteRateio} />
                </div>
            </section>

            {/* Mapa */}
            <section className="space-y-4">
                <SectionHeader title="Distribuição Geográfica" subtitle="Localização dos clientes no Brasil" />
                <div className="min-h-[400px]">
                    <ClientesMapDynamic data={data.mapaClientes} />
                </div>
            </section>
        </div>
    );
}
