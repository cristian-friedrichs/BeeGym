import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';

// Navbar height: py-5 (20px top + 20px bottom) + logo h-10 (40px) = 80px
const NAVBAR_H = 80;

export function Hero() {
    return (
        <section
            id="hero"
            className="relative flex items-center justify-center bg-[#0B0F1A] overflow-hidden"
            style={{ marginTop: NAVBAR_H, height: `calc(100vh - ${NAVBAR_H}px)` }}
        >
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none -z-0" aria-hidden="true">
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-bee-amber/8 blur-[140px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#E67E22]/6 blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center justify-center gap-6 md:gap-8 py-8">
                {/* Badge */}
                <div
                    id="hero-badge"
                    className="inline-flex items-center gap-2.5 border border-bee-amber/30 bg-bee-amber/5 px-4 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-bee-amber"
                >
                    <Zap className="w-3 h-3 fill-bee-amber shrink-0" />
                    Gestão fitness a partir de R$ 9,90/mês
                </div>

                {/* Headline */}
                <h1 className="text-center font-display leading-[1.0] tracking-[-0.03em] text-white">
                    <span className="block text-[clamp(2.4rem,6vw,5.5rem)] font-bold mb-2">
                        Sua gestão fitness
                    </span>
                    <span className="block text-[clamp(2rem,5vw,5rem)] font-bold text-bee-amber italic">
                        inteligente e descomplicada.
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-center text-slate-400 text-sm md:text-lg max-w-4xl mx-auto leading-relaxed font-medium">
                    Alunos, treinos e pagamentos 100% integrados. <br className="hidden md:block" />
                    Criado para <strong className="text-white font-extrabold tracking-tight">Personal Trainers, Studios, Escolas Esportivas e Academias.</strong>
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                    <Link href="/register" className="w-full sm:w-auto">
                        <Button
                            id="hero-cta-primary"
                            size="lg"
                            className="group w-full sm:w-auto bg-bee-amber text-bee-midnight font-bold h-12 md:h-14 px-8 md:px-10 rounded-full text-sm md:text-base tracking-widest uppercase hover:bg-[#E67E22] transition-all duration-200 shadow-[0_0_40px_rgba(255,191,0,0.25)] hover:shadow-[0_0_60px_rgba(255,191,0,0.4)] hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            Começar Agora
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="#planos" className="w-full sm:w-auto">
                        <Button
                            id="hero-cta-secondary"
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto border border-white/20 text-white font-bold h-12 md:h-14 px-8 md:px-10 rounded-full text-sm md:text-base tracking-wide bg-transparent hover:bg-white/5 hover:border-white/40 transition-all duration-200"
                        >
                            Ver Planos
                        </Button>
                    </Link>
                </div>

                {/* Trust row */}
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs md:text-sm font-medium text-slate-500">
                    {['7 dias de teste completo', 'Cancele quando quiser'].map((item) => (
                        <span key={item} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-bee-amber inline-block" />
                            {item}
                        </span>
                    ))}
                </div>

                {/* Bottom divider */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
        </section>
    );
}
