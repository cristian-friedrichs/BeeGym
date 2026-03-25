import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Testimonials inline — replaces the empty mockup with real social proof
const TESTIMONIALS = [
    {
        name: 'Rodrigo Almeida',
        role: 'Personal Trainer · São Paulo',
        initials: 'RA',
        quote: 'Antes eu gastava 2 horas por semana só enviando treinos pelo WhatsApp. Hoje levo menos de 10 minutos. A BeeGym mudou minha rotina completamente.',
    },
    {
        name: 'Carla Mendes',
        role: 'Studio de Pilates · RJ',
        initials: 'CM',
        quote: 'O faturamento automático via Pix me poupou muito estresse. Antes tinha inadimplência toda semana. Agora os alunos pagam sozinhos e recebo notificação.',
    },
    {
        name: 'Lucas Ferreira',
        role: 'Academia · BH',
        initials: 'LF',
        quote: 'O painel de relatórios me fez entender pela primeira vez onde estava ganhando e perdendo dinheiro. Indispensável para quem leva a sério o negócio.',
    },
];

export function PlatformOverview() {
    return (
        <section id="depoimentos" className="py-28 md:py-36 bg-slate-50">
            <div className="container mx-auto px-6 md:px-12">
                <div className="max-w-2xl mb-16">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">Depoimentos</p>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-bee-midnight leading-[1.05] tracking-tight">
                        Quem usa, recomenda.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-white p-8 md:p-10 flex flex-col gap-6">
                            {/* Quote */}
                            <p className="text-slate-600 font-medium leading-relaxed text-base flex-1">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-bee-amber flex items-center justify-center text-bee-midnight font-bold text-sm shrink-0">
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-bee-midnight">{t.name}</p>
                                    <p className="text-xs text-slate-400 font-medium">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA secondary */}
                <div className="mt-12 flex justify-center">
                    <Link href="/register">
                        <Button
                            id="testimonials-cta"
                            variant="outline"
                            className="border border-bee-midnight/20 text-bee-midnight font-bold rounded-full px-8 h-12 tracking-wide hover:bg-bee-midnight hover:text-white hover:border-bee-midnight transition-all duration-200 flex items-center gap-2"
                        >
                            Experimente Agora
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
