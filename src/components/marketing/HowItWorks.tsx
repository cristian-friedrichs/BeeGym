const STEPS = [
    {
        num: '01',
        title: 'Crie sua conta em 2 minutos',
        desc: 'Configure sua organização, planos e instrutores. Sem burocracia, sem formulário longo.',
        time: '2 min',
    },
    {
        num: '02',
        title: 'Cadastre seus alunos',
        desc: 'Importe ou adicione alunos, vincule aos planos e ative o faturamento automático na hora.',
        time: '5 min',
    },
    {
        num: '03',
        title: 'Comece a crescer',
        desc: 'Prescreva treinos, receba pagamentos e acompanhe os indicadores do seu negócio fitness.',
        time: 'Sempre',
    },
];

export function HowItWorks() {
    return (
        <section id="como-funciona" className="py-28 md:py-36 bg-[#0B0F1A]">
            <div className="container mx-auto px-6 md:px-12">
                <div className="max-w-2xl mb-20">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">
                        Como funciona
                    </p>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.05] tracking-tight">
                        Três passos para transformar seu negócio.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
                    {STEPS.map((step, i) => (
                        <div
                            key={i}
                            className="bg-[#0B0F1A] p-10 md:p-12 flex flex-col gap-6 hover:bg-white/2 transition-colors duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-[5rem] font-display font-bold text-white/5 leading-none">
                                    {step.num}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-widest text-bee-amber border border-bee-amber/30 px-2 py-1 mt-2">
                                    {step.time}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
