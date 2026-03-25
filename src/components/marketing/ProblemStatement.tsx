const PAINS = [
    { old: 'Planilhas confusas para controlar alunos', icon: '📊' },
    { old: 'WhatsApp para enviar treinos e cobrar', icon: '📱' },
    { old: 'Agendas separadas e sempre desatualizadas', icon: '📅' },
    { old: 'Controle financeiro no caderno ou cabeça', icon: '💸' },
];

export function ProblemStatement() {
    return (
        <section id="problema" className="py-28 md:py-36 bg-[#0B0F1A] relative overflow-hidden">
            {/* Subtle amber bleed */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-bee-amber/4 blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12">
                <div className="max-w-5xl mx-auto">
                    {/* Section label */}
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-6">
                        O problema
                    </p>

                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white leading-[1.05] tracking-tight mb-16">
                        Você ainda gerencia seu negócio fitness{' '}
                        <span className="text-slate-500">no improviso?</span>
                    </h2>

                    {/* Pain list — horizontal cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/8">
                        {PAINS.map((pain, i) => (
                            <div
                                key={i}
                                className="group flex items-start gap-5 p-8 border-b border-r border-white/8 last:border-b-0 even:border-r-0 md:even:border-r transition-colors duration-200 hover:bg-white/3"
                            >
                                <span className="text-3xl shrink-0 opacity-50 group-hover:opacity-80 transition-opacity">{pain.icon}</span>
                                <p className="text-slate-400 font-medium text-lg leading-snug group-hover:text-slate-200 transition-colors line-through decoration-bee-amber/40 decoration-2">
                                    {pain.old}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Resolution banner */}
                    <div className="mt-0 bg-bee-amber p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <p className="text-bee-midnight font-display text-2xl md:text-3xl font-bold leading-snug">
                            A BeeGym centraliza <span className="italic">tudo isso</span> em um único sistema.
                        </p>
                        <span className="shrink-0 text-4xl font-bold text-bee-midnight/30">→</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
