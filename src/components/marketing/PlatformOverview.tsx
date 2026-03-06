export function PlatformOverview() {
    return (
        <section className="py-24 md:py-32 bg-white">
            <div className="container mx-auto px-6 md:px-12 text-center">
                <div className="max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-bee-midnight tracking-tight mb-6">
                        Uma visão completa do seu negócio fitness
                    </h2>
                    <p className="text-xl text-slate-600 leading-relaxed font-medium">
                        A BeeGym permite acompanhar alunos, agenda, treinos e finanças em tempo real. Tenha controle total do seu negócio em um único painel.
                    </p>
                </div>

                {/* The secondary wide mockup */}
                <div className="relative mx-auto max-w-6xl rounded-[2rem] border border-slate-200/50 bg-slate-50 shadow-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center px-4 py-3 bg-white border-b border-slate-100">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        </div>
                    </div>
                    <div className="aspect-[16/8] md:aspect-[21/9] w-full bg-slate-50 relative">
                        <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-400">
                            <p className="font-medium">Overview Panel / Relatórios Mocks</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
