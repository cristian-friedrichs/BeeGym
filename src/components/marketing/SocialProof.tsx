export function SocialProof() {
    const stats = [
        { value: '+10.000', label: 'Treinos criados', suffix: '' },
        { value: '+5.000', label: 'Alunos gerenciados', suffix: '' },
        { value: '+200', label: 'Profissionais ativos', suffix: '' },
        { value: '4.9', label: 'Avaliação média', suffix: '★' },
    ];

    return (
        <section id="social-proof" className="bg-bee-amber py-16">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-bee-midnight/20">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex flex-col items-center justify-center py-8 px-4 text-center"
                        >
                            <span className="text-5xl md:text-6xl font-display font-bold text-bee-midnight tracking-tight leading-none mb-2">
                                {stat.value}
                                {stat.suffix && (
                                    <span className="text-3xl ml-1">{stat.suffix}</span>
                                )}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-bee-midnight/60">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
