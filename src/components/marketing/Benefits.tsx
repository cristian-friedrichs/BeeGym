import { Clock, TrendingUp, ShieldCheck } from 'lucide-react';

const BENEFITS = [
    {
        icon: Clock,
        stat: '4h',
        statLabel: 'economizadas por semana',
        title: 'Automatize o que te consome',
        body: 'Cobranças, envio de treinos, recibos e lembretes no piloto automático. Você para no que importa: os seus alunos.',
        bullets: ['Faturamento automático via Pix e Cartão', 'Notificações de pagamento automáticas', 'Agenda que se atualiza sozinha'],
    },
    {
        icon: TrendingUp,
        stat: '85%',
        statLabel: 'de retenção média dos usuários',
        title: 'Escale sem perder qualidade',
        body: 'Gerencie mais alunos e entregue uma experiência premium. Portal online, fichas atualizadas e comunicação centralizada.',
        bullets: ['Portal white-label para os alunos', 'Histórico completo de evolução', 'Avaliações físicas integradas'],
    },
    {
        icon: ShieldCheck,
        stat: '100%',
        statLabel: 'de garantia em 30 dias',
        title: 'Sem risco. Sem letra miúda.',
        body: 'Se a BeeGym não transformar a gestão do seu negócio fitness em até 30 dias, devolvemos cada centavo. Simples assim.',
        bullets: ['Devolução integral garantida', 'Sem perguntas, sem burocracia', 'Suporte humano incluso'],
    },
];

export function Benefits() {
    return (
        <section id="beneficios" className="py-28 md:py-36 bg-[#0B0F1A] relative overflow-hidden">
            {/* Amber accent top-right */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-bee-amber/4 blur-[160px] pointer-events-none" />

            <div className="container mx-auto px-6 md:px-12">
                <div className="max-w-2xl mb-20">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">
                        Por que BeeGym
                    </p>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.05] tracking-tight">
                        Números que mostram o impacto.
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">
                    {BENEFITS.map((b, i) => (
                        <div key={i} className="bg-[#0B0F1A] p-10 md:p-12 flex flex-col gap-8 hover:bg-white/2 transition-colors duration-300">
                            {/* Stat */}
                            <div>
                                <span className="text-7xl font-display font-bold text-bee-amber tracking-tight leading-none">
                                    {b.stat}
                                </span>
                                <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">
                                    {b.statLabel}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="h-px w-12 bg-bee-amber/40" />

                            {/* Content */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{b.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed mb-6">{b.body}</p>
                                <ul className="space-y-2">
                                    {b.bullets.map((bullet) => (
                                        <li key={bullet} className="flex items-center gap-3 text-sm text-slate-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-bee-amber shrink-0" />
                                            {bullet}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
