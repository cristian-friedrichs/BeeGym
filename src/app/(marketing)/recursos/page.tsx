import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Smartphone, BarChart3, Users, CalendarCheck, Dumbbell } from 'lucide-react';
import Link from 'next/link';

export default function RecursosPage() {
    const deepFeatures = [
        {
            title: "Gestão de Alunos 360°",
            description: "Controle total desde o cadastro até a evolução física. Histórico completo, anamnese e controle de presença automatizado.",
            icon: Users,
        },
        {
            title: "Prescrição de Treinos",
            description: "Crie treinos complexos em segundos com nossa biblioteca de exercícios. Envie direto para o app do aluno.",
            icon: Dumbbell,
        },
        {
            title: "Financeiro Inteligente",
            description: "Cobranças automáticas via PIX e Cartão. Relatórios de inadimplência e fluxo de caixa em tempo real.",
            icon: BarChart3,
        },
        {
            title: "Agenda & Aulas",
            description: "Calendário completo com agendamento de aulas individuais e coletivas. Controle de presença e turmas.",
            icon: CalendarCheck,
        },
        {
            title: "App do Aluno",
            description: "Uma experiência premium para seu aluno acompanhar treinos, pagar mensalidades e ver resultados. Disponível a partir do plano Studio.",
            icon: Smartphone,
        },
        {
            title: "Segurança de Dados",
            description: "Seus dados e os dados dos seus alunos protegidos com criptografia de ponta a ponta e backups diários.",
            icon: Shield,
        }
    ];

    return (
        <div className="pt-40 pb-24">
            <div className="container mx-auto px-6 md:px-12">
                {/* Hero Section Page */}
                <div className="max-w-4xl mx-auto text-center mb-28">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">Recursos</p>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8 leading-[1.1]">
                        Ferramentas potentes para <br />
                        <span className="text-bee-amber italic font-medium inline-block md:whitespace-nowrap">escalar seu negócio.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
                        O BeeGym foi construído para eliminar o trabalho manual. Deixe a burocracia com a gente e foque no que você faz de melhor: cuidar da saúde dos seus alunos.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="bg-bee-amber hover:bg-[#E67E22] text-bee-midnight rounded-full px-10 h-14 font-bold text-lg">
                                Começar Agora
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Feature Narrative */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5 mb-28">
                    <div className="p-10 md:p-16 flex items-center order-2 md:order-1 overflow-hidden">
                        <div className="relative aspect-video w-full bg-white/5 border border-white/10 overflow-hidden group">
                            <img 
                                src="/images/marketing/financial-dashboard.png" 
                                alt="Dashboard Financeiro BeeGym"
                                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 brightness-90 group-hover:brightness-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/60 to-transparent pointer-events-none" />
                        </div>
                    </div>
                    <div className="p-10 md:p-16 order-1 md:order-2 flex flex-col justify-center">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Financeiro que trabalha por você</h2>
                        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                            Esqueça as planilhas e a cobrança manual. O BeeGym automatiza todo o seu recebimento, envia lembretes por WhatsApp e gerencia suas assinaturas de forma inteligente.
                        </p>
                        <ul className="space-y-4">
                            {["Recorrência automática no cartão", "Conciliação de PIX instantânea", "Relatórios de lucratividade"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 font-medium text-white">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4 text-bee-amber" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Deep Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
                    {deepFeatures.map((feature, i) => (
                        <div key={i} className="p-8 md:p-10 bg-[#0B0F1A] hover:bg-white/[0.02] transition-colors group">
                            <div className="w-12 h-12 bg-bee-amber/10 flex items-center justify-center mb-6 group-hover:bg-bee-amber/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-bee-amber" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-500 leading-relaxed text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
