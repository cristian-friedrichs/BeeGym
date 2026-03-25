import { Users, CalendarDays, Dumbbell, Wallet, LineChart, MessageSquare } from 'lucide-react';

const FEATURES = [
    {
        icon: Users,
        title: 'Gestão de Alunos',
        description: 'Ficha completa, histórico de treinos, avaliações físicas e acompanhamento de evolução. Tudo em tempo real.',
        highlight: true,
    },
    {
        icon: Dumbbell,
        title: 'Treinos Personalizados',
        description: 'Monte treinos profissionais com biblioteca de exercícios e envie diretamente para o aluno.',
    },
    {
        icon: CalendarDays,
        title: 'Agenda Integrada',
        description: 'Organize aulas, sessões e horários sem conflitos. Visão diária, semanal e mensal.',
    },
    {
        icon: Wallet,
        title: 'Cobranças Automáticas',
        description: 'Pix Automático e cartão recorrente integrados. Cobranças no piloto automático, zero inadimplência.',
        highlight: true,
    },
    {
        icon: LineChart,
        title: 'Relatórios e Métricas',
        description: 'Veja o desempenho do negócio, receita, alunos ativos e inadimplência em dashboards claros.',
    },
    {
        icon: MessageSquare,
        title: 'Comunicação Centralizada',
        description: 'Feedbacks, recibos e notificações — tudo dentro da plataforma, sem WhatsApp.',
    },
];

export function FeaturesGrid() {
    return (
        <section id="recursos" className="py-28 md:py-36 bg-[#0B0F1A] relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute right-0 top-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-bee-amber/5 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mb-20">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">
                        Recursos
                    </p>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.05] tracking-tight mb-6">
                        Ferramentas que fazem seu negócio crescer.
                    </h2>
                    <p className="text-lg text-slate-400 font-medium">
                        Nada de app por cima de app. Um sistema que cobre do aluno ao financeiro.
                    </p>
                </div>

                {/* Asymmetric feature grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
                    {FEATURES.map((feature, i) => (
                        <div
                            key={i}
                            id={`feature-${i}`}
                            className={`group relative p-8 md:p-10 transition-all duration-300 ${
                                feature.highlight
                                    ? 'bg-bee-midnight border-l-2 border-l-bee-amber'
                                    : 'bg-[#0B0F1A] hover:bg-white/[0.03]'
                            }`}
                        >
                            {/* Icon */}
                            <div
                                className={`w-12 h-12 flex items-center justify-center mb-6 ${
                                    feature.highlight
                                        ? 'bg-bee-amber/15 text-bee-amber'
                                        : 'bg-white/5 text-slate-400 group-hover:bg-bee-amber/15 group-hover:text-bee-amber transition-all duration-300'
                                }`}
                            >
                                <feature.icon className="w-6 h-6" />
                            </div>

                            <h3
                                className={`text-xl font-bold mb-3 tracking-tight ${
                                    feature.highlight ? 'text-white' : 'text-white'
                                }`}
                            >
                                {feature.title}
                            </h3>
                            <p
                                className={`text-sm leading-relaxed font-medium ${
                                    feature.highlight ? 'text-slate-400' : 'text-slate-500'
                                }`}
                            >
                                {feature.description}
                            </p>

                            {feature.highlight && (
                                <div className="absolute bottom-8 right-8 text-bee-amber/10 font-display font-bold text-6xl leading-none pointer-events-none">
                                    ↗
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
