import { Users, CalendarDays, Dumbbell, MessageSquare, LineChart, Wallet } from 'lucide-react';

export function FeaturesGrid() {
    const features = [
        {
            icon: Users,
            title: "Gestão de Alunos",
            description: "Cadastre, acompanhe e organize todos os seus alunos em um único lugar com fichas detalhadas.",
            delay: "0.1s"
        },
        {
            icon: CalendarDays,
            title: "Agenda Inteligente",
            description: "Organize aulas, sessões e compromissos com facilidade. Evite choques de horários.",
            delay: "0.2s"
        },
        {
            icon: Dumbbell,
            title: "Treinos Personalizados",
            description: "Monte e acompanhe treinos profissionais para seus alunos com biblioteca de exercícios.",
            delay: "0.3s"
        },
        {
            icon: MessageSquare,
            title: "Comunicação Eficiente",
            description: "Centralize conversas e feedbacks. Mantenha seus alunos engajados na jornada.",
            delay: "0.4s"
        },
        {
            icon: Wallet,
            title: "Controle Financeiro",
            description: "Acompanhe receitas, pagamentos e pendências. Faturamento automático via Pix e Cartão.",
            delay: "0.5s"
        },
        {
            icon: LineChart,
            title: "Relatórios e Métricas",
            description: "Entenda o desempenho do seu negócio fitness com dashboards claros e visuais.",
            delay: "0.6s"
        }
    ];

    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-bee-midnight mb-6">
                        Ferramentas para Entregar Excelência
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        Tudo o que você precisa para profissionalizar sua operação, organizado em um painel intuitivo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group p-8 bg-white border border-slate-200 hover:border-bee-amber/50 rounded-3xl shadow-soft hover:shadow-xl transition-all duration-300 animate-fade-in-up hover:-translate-y-1"
                            style={{ animationDelay: feature.delay }}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-bee-amber/20 flex items-center justify-center mb-6 transition-colors duration-300">
                                <feature.icon className="w-7 h-7 text-bee-midnight" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-bee-midnight mb-3">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
