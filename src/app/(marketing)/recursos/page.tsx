import { FeaturesGrid } from '@/components/marketing/FeaturesGrid';
import { PlatformOverview } from '@/components/marketing/PlatformOverview';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Smartphone, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';

export default function RecursosPage() {
    const deepFeatures = [
        {
            title: "Gestão de Alunos 360°",
            description: "Controle total desde o cadastro até a evolução física. Histórico completo, anamnese e controle de presença automatizado.",
            icon: Users,
            color: "bg-blue-500/10 text-blue-600"
        },
        {
            title: "Prescrição de Treinos",
            description: "Crie treinos complexos em segundos com nossa biblioteca de exercícios. Envie direto para o app do aluno.",
            icon: Zap,
            color: "bg-bee-amber/10 text-bee-midnight"
        },
        {
            title: "Financeiro Inteligente",
            description: "Cobranças automáticas via PIX e Cartão. Relatórios de inadimplência e fluxo de caixa em tempo real.",
            icon: BarChart3,
            color: "bg-emerald-500/10 text-emerald-600"
        },
        {
            title: "App do Aluno",
            description: "Uma experiência premium para seu aluno acompanhar treinos, pagar mensalidades e ver resultados.",
            icon: Smartphone,
            color: "bg-purple-500/10 text-purple-600"
        },
        {
            title: "Segurança de Dados",
            description: "Seus dados e os dados dos seus alunos protegidos com criptografia de ponta a ponta e backups diários.",
            icon: Shield,
            color: "bg-slate-500/10 text-slate-600"
        }
    ];

    return (
        <div className="pt-48 pb-24">
            <div className="container mx-auto px-6 md:px-12">
                {/* Hero Section Page */}
                <div className="max-w-4xl mx-auto text-center mb-24">
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-bee-midnight tracking-tight mb-8 leading-[1.1]">
                        Ferramentas potentes para <br />
                        <span className="text-bee-amber italic font-medium inline-block md:whitespace-nowrap">escalar seu negócio.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-16">
                        O BeeGym foi construído para eliminar o trabalho manual. Deixe a burocracia com a gente e foque no que você faz de melhor: cuidar da saúde dos seus alunos.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="bg-bee-midnight text-white rounded-full px-8 h-14 font-bold text-lg">
                                Começar agora
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Feature Narrative */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-32 items-center">
                    <div className="order-2 md:order-1">
                        <div className="relative aspect-video rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden shadow-2xl animate-float">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
                                Visual Mockup: Dashboard Finaceiro
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-bee-midnight mb-6">Financeiro que trabalha por você</h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Esqueça as planilhas e a cobrança manual. O BeeGym automatiza todo o seu recebimento, envia lembretes por WhatsApp e gerencia suas assinaturas de forma inteligente.
                        </p>
                        <ul className="space-y-4">
                            {["Recorrência automática no cartão", "Conciliação de PIX instantânea", "Relatórios de lucratividade"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 font-medium text-bee-midnight">
                                    <div className="w-6 h-6 rounded-full bg-emerald- brand/20 flex items-center justify-center">
                                        <ArrowRight className="w-4 h-4 text-emerald-brand" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Deep Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {deepFeatures.map((feature, i) => (
                        <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-bee-amber/30 transition-all hover:bg-white hover:shadow-xl group">
                            <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-bee-midnight mb-4">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
