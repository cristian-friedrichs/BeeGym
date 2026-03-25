import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Testimonials inline — replaces the empty mockup with real social proof
const TESTIMONIALS = [
    {
        name: 'Rodrigo Almeida',
        role: 'Personal Trainer · São Paulo',
        initials: 'RA',
        avatar: '/images/marketing/testimonials/rodrigo.png',
        quote: 'Antes eu gastava 2 horas por semana só enviando treinos pelo WhatsApp. Hoje levo menos de 10 minutos. A BeeGym mudou minha rotina completamente.',
    },
    {
        name: 'Carla Mendes',
        role: 'Studio de Pilates · RJ',
        initials: 'CM',
        avatar: '/images/marketing/testimonials/carla.png',
        quote: 'O faturamento automático via Pix me poupou muito estresse. Antes tinha inadimplência toda semana. Agora os alunos pagam sozinhos e recebo notificação.',
    },
    {
        name: 'Lucas Ferreira',
        role: 'Academia · BH',
        initials: 'LF',
        avatar: '/images/marketing/testimonials/lucas.png',
        quote: 'O painel de relatórios me fez entender pela primeira vez onde estava ganhando e perdendo dinheiro. Indispensável para quem leva a sério o negócio.',
    },
];

export function PlatformOverview() {
    return (
        <section id="depoimentos" className="py-28 md:py-36 bg-[#0B0F1A] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-bee-amber/5 blur-[120px] pointer-events-none" />
            
            <div className="container mx-auto px-6 md:px-12 relative z-10">
                <div className="max-w-2xl mb-16">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">Depoimentos</p>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.05] tracking-tight">
                        Quem usa, recomenda.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-[#0B0F1A] p-8 md:p-10 flex flex-col gap-8 group hover:bg-white/[0.02] transition-colors duration-300">
                            {/* Quote */}
                            <p className="text-slate-400 font-medium leading-relaxed text-base flex-1 italic">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-bee-amber/10 border border-white/10 flex items-center justify-center text-bee-amber font-bold text-sm shrink-0 overflow-hidden rounded-full">
                                        {t.avatar ? (
                                            <img 
                                                src={t.avatar} 
                                                alt={t.name}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                            />
                                        ) : t.initials}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-bee-amber rounded-full border-2 border-[#0B0F1A] flex items-center justify-center">
                                        <div className="w-1 h-1 bg-bee-midnight rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white group-hover:text-bee-amber transition-colors">{t.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA secondary */}
                <div className="mt-16 flex justify-center">
                    <Link href="/register">
                        <Button
                            id="testimonials-cta"
                            className="bg-transparent border border-white/10 text-white font-bold rounded-full px-10 h-14 tracking-widest uppercase hover:bg-white/5 hover:border-white/20 transition-all duration-300 flex items-center gap-3 group"
                        >
                            Criar Minha Conta
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
