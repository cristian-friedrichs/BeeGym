export function SocialProof() {
    return (
        <section className="py-20 bg-bee-midnight text-white">
            <div className="container mx-auto px-6 md:px-12 text-center">
                <h2 className="text-xl md:text-2xl font-medium text-slate-300 mb-12 animate-fade-in-up">
                    Profissionais de fitness estão organizando seus negócios com BeeGym
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex flex-col items-center justify-center p-6">
                        <span className="text-5xl md:text-6xl font-display font-bold text-bee-amber mb-2">+10.000</span>
                        <span className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-wider">Treinos Criados</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6">
                        <span className="text-5xl md:text-6xl font-display font-bold text-bee-amber mb-2">+5.000</span>
                        <span className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-wider">Alunos Gerenciados</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6">
                        <span className="text-5xl md:text-6xl font-display font-bold text-bee-amber mb-2">+200</span>
                        <span className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-wider">Profissionais Ativos</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6">
                        <span className="text-5xl md:text-6xl font-display font-bold text-bee-amber mb-2">85%</span>
                        <span className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-wider">Mais Organização</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
