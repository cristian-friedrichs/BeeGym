import { Audiences } from '@/components/marketing/Audiences';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ParaQuemEPage() {
    return (
        <div className="pt-40 pb-24">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-4xl mx-auto mb-28">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">Para Quem É</p>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8 leading-[1.1]">
                        Feito para quem vive do <br />
                        <span className="text-bee-amber italic font-medium inline-block md:whitespace-nowrap">movimento.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Seja você um Personal Trainer independente ou o dono de uma rede de academias, o BeeGym se adapta ao seu fluxo de trabalho.
                    </p>
                </div>

                <Audiences />

                {/* CTA Block */}
                <div className="mt-28 border border-white/10 bg-white/[0.02] p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[400px] h-[400px] bg-bee-amber/5 blur-[120px] pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-8 leading-tight">
                                Mais do que um sistema, o seu parceiro de crescimento.
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
                                Entendemos as dores do mercado fitness. Por isso, criamos uma ferramenta que não apenas organiza, mas impulsiona seu faturamento e profissionalismo.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/register">
                                    <Button size="lg" className="bg-bee-amber hover:bg-[#E67E22] text-bee-midnight font-bold rounded-full px-10 h-14 text-lg w-full sm:w-auto">
                                        Experimentar Agora
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="relative h-[400px] lg:h-full min-h-[400px] flex items-center justify-center">
                            <div className="relative w-full h-full bg-white/5 border border-white/10 overflow-hidden rotate-3 shadow-2xl group">
                                <img 
                                    src="/images/marketing/success-trainer.png" 
                                    alt="Personal Trainer de Sucesso"
                                    className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" 
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bee-midnight/80 to-transparent" />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-[#0B0F1A] border border-white/10 p-6 max-w-xs shadow-2xl z-20">
                                <p className="text-sm italic font-medium mb-4 text-slate-300">&quot;O BeeGym mudou a forma como gerencio meu Studio. Hoje tenho 3x mais tempo para focar na aula.&quot;</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-bee-amber flex items-center justify-center text-bee-midnight font-bold">MF</div>
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase tracking-wider">Maria Flor</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Studio Fit Life</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
