import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function BannerCTA() {
    return (
        <section id="cta-final" className="bg-[#0B0F1A] py-28 md:py-36 relative overflow-hidden">
            {/* Amber flood from bottom */}
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-bee-amber/10 to-transparent pointer-events-none" />
            {/* Grid */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="relative z-10 container mx-auto px-6 md:px-12 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-8">
                    Comece hoje
                </p>

                <h2 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.0] tracking-tight mb-8 max-w-4xl mx-auto">
                    Seu negócio fitness merece gestão profissional.
                </h2>

                <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto mb-14 leading-relaxed">
                    Junte-se a mais de 200 profissionais que já pararam de improvisar e começaram a crescer com a BeeGym.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/register" className="w-full sm:w-auto">
                        <Button
                            id="cta-final-primary"
                            size="lg"
                            className="group w-full sm:w-auto bg-bee-amber text-bee-midnight font-bold h-16 px-12 rounded-full text-base tracking-widest uppercase hover:bg-[#E67E22] transition-all duration-200 shadow-[0_0_60px_rgba(255,191,0,0.3)] hover:shadow-[0_0_80px_rgba(255,191,0,0.5)] hover:-translate-y-0.5 flex items-center gap-3 text-lg"
                        >
                            Experimentar Agora
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="/planos" className="w-full sm:w-auto">
                        <Button
                            id="cta-final-secondary"
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto border border-white/20 text-white font-bold h-16 px-10 rounded-full text-base tracking-wide bg-transparent hover:bg-white/5 transition-all duration-200 text-lg"
                        >
                            Ver todos os planos
                        </Button>
                    </Link>
                </div>

                <p className="text-slate-600 text-sm mt-8 font-medium">
                    7 dias de teste · Cancele quando quiser
                </p>
            </div>
        </section>
    );
}
