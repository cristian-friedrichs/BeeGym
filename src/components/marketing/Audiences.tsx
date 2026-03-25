import { User, Users2, Trophy, Building2 } from 'lucide-react';

const TARGETS = [
    {
        icon: User,
        tag: 'Solo',
        title: 'Personal Trainers',
        desc: 'Organize alunos, prescreva treinos e controle sua agenda sem depender de Word ou planilhas.',
    },
    {
        icon: Users2,
        tag: 'Grupo',
        title: 'Studios de Treinamento',
        desc: 'Gerencie turmas, check-ins, professores e acompanhamento em grupo com facilidade.',
    },
    {
        icon: Trophy,
        tag: 'Esporte',
        title: 'Escolas Esportivas',
        desc: 'Controle atletas, matrículas, evoluções técnicas e mensalidades em um só sistema.',
    },
    {
        icon: Building2,
        tag: 'Escala',
        title: 'Academias',
        desc: 'Centralize planos, contratos, instrutores e relatórios em um painel completo.',
    },
];

export function Audiences() {
    return (
        <section id="para-quem" className="py-28 md:py-36">
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row gap-4 md:items-end justify-between mb-16">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">
                            Para quem é
                        </p>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.05] tracking-tight">
                            Para todo o ecossistema fitness.
                        </h2>
                    </div>
                    <p className="text-slate-500 font-medium max-w-xs text-right hidden md:block">
                        Do autônomo à grande rede — a BeeGym se adapta à sua escala.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
                    {TARGETS.map((t, i) => (
                        <div
                            key={i}
                            className="group bg-[#0B0F1A] p-8 md:p-10 flex flex-col gap-5 hover:bg-white/[0.03] transition-all duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 bg-bee-amber flex items-center justify-center text-bee-midnight shrink-0">
                                    <t.icon className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-700 group-hover:text-slate-500 pt-1">
                                    {t.tag}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">
                                {t.title}
                            </h3>
                            <p className="text-slate-500 group-hover:text-slate-400 font-medium leading-relaxed text-sm">
                                {t.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
