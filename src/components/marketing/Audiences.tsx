const TARGETS = [
    {
        image: '/images/marketing/audiences/personal-trainer.png',
        tag: 'Solo',
        title: 'Personal Trainer',
        desc: 'Organize alunos, prescreva treinos e controle sua agenda sem depender de Word ou planilhas.',
    },
    {
        image: '/images/marketing/audiences/pilates-studio.png',
        tag: 'Grupo',
        title: 'Studios de Pilates',
        desc: 'Gerencie turmas, check-ins, professores e acompanhamento em grupo com facilidade.',
    },
    {
        image: '/images/marketing/audiences/judo-school.png',
        tag: 'Esporte',
        title: 'Escola de Judô',
        desc: 'Controle atletas, matrículas, evoluções técnicas e mensalidades em um só sistema.',
    },
    {
        image: '/images/marketing/audiences/gym.png',
        tag: 'Escala',
        title: 'Academia',
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 overflow-hidden">
                    {TARGETS.map((t, i) => (
                        <div
                            key={i}
                            className="group bg-[#0B0F1A] border-r border-[#0B0F1A] last:border-0 flex flex-col hover:bg-white/[0.03] transition-all duration-300"
                        >
                            {/* Image Visual */}
                            <div className="relative aspect-video overflow-hidden group">
                                <img 
                                    src={t.image} 
                                    alt={t.title}
                                    className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700 h-full"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0B0F1A] to-transparent" />
                                
                                {/* Tag Overlay */}
                                <div className="absolute top-4 left-6 bg-bee-amber text-bee-midnight text-[9px] font-black uppercase tracking-widest px-2 py-1">
                                    {t.tag}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 md:p-10 flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-bee-amber transition-colors">
                                    {t.title}
                                </h3>
                                <p className="text-slate-500 group-hover:text-slate-400 font-medium leading-relaxed text-sm">
                                    {t.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
