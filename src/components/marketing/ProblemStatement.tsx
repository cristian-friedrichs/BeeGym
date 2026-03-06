export function ProblemStatement() {
    return (
        <section className="py-32 bg-slate-50 relative overflow-hidden">
            <div className="absolute -left-40 top-20 w-80 h-80 rounded-full bg-coral-red/5 blur-[100px] pointer-events-none" />
            <div className="absolute -right-40 bottom-20 w-80 h-80 rounded-full bg-bee-amber/5 blur-[100px] pointer-events-none" />
            <div className="container mx-auto px-6 md:px-12">
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-bee-midnight tracking-tight leading-[1.1] mb-12 animate-fade-in-up">
                        Gerenciar um negócio fitness<br /><span className="text-slate-400">não deveria ser complicado.</span>
                    </h2>

                    <div className="w-full max-w-2xl bg-white rounded-3xl p-8 md:p-12 shadow-soft border border-slate-100 text-left animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <p className="text-xl text-slate-700 mb-8 font-semibold">
                            Personal trainers, studios e academias acabam usando várias ferramentas ao mesmo tempo:
                        </p>

                        <ul className="space-y-4 mb-10 text-lg text-slate-500 font-medium">
                            <li className="flex items-center gap-4">
                                <span className="text-coral-red">✕</span>
                                <span className="line-through decoration-coral-red/40 decoration-2">Planilhas confusas para alunos</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <span className="text-coral-red">✕</span>
                                <span className="line-through decoration-coral-red/40 decoration-2">WhatsApp para enviar treinos</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <span className="text-coral-red">✕</span>
                                <span className="line-through decoration-coral-red/40 decoration-2">Agendas separadas e desatualizadas</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <span className="text-coral-red">✕</span>
                                <span className="line-through decoration-coral-red/40 decoration-2">Controle financeiro desorganizado</span>
                            </li>
                        </ul>

                        <div className="p-6 rounded-2xl bg-bee-midnight text-white text-center font-bold text-xl md:text-2xl shadow-xl transform hover:-translate-y-1 transition-transform duration-300">
                            A BeeGym <span className="text-bee-amber">centraliza tudo</span> em um único sistema.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
