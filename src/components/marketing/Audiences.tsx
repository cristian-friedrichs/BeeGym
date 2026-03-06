import { User, Users2, Trophy, Building2 } from 'lucide-react';

export function Audiences() {
    const targets = [
        {
            icon: User,
            title: "Personal Trainers",
            desc: "Organize alunos, prescreva treinos e controle sua agenda sem depender de Word ou planilhas."
        },
        {
            icon: Users2,
            title: "Studios de Treinamento",
            desc: "Gerencie turmas, check-ins, professores e acompanhamento em grupo."
        },
        {
            icon: Trophy,
            title: "Escolas Esportivas",
            desc: "Controle atletas, matrículas, evoluções técnicas e mensalidades dos responsáveis."
        },
        {
            icon: Building2,
            title: "Academias",
            desc: "Centralize catracas, planos, contratos anuais e gestão de instrutores."
        }
    ];

    return (
        <section className="py-24 bg-bee-midnight text-white" id="para-quem">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
                    <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                        Feito para todo o ecossistema
                    </h2>
                    <p className="text-lg text-slate-300 font-medium">
                        Seja você um profissional autônomo ou uma grande rede, o BeeGym se adapta à sua escala.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {targets.map((target, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors animate-fade-in-up" style={{ animationDelay: `${0.2 * idx}s` }}>
                            <div className="w-12 h-12 rounded-xl bg-bee-amber text-bee-midnight flex items-center justify-center mb-6">
                                <target.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{target.title}</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                {target.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
