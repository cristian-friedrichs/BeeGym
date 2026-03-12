import { Audiences } from '@/components/marketing/Audiences';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ParaQuemEPage() {
    return (
        <div className="pt-48 pb-24">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-4xl mx-auto mb-24">
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-bee-midnight tracking-tight mb-8 leading-[1.1]">
                        Feito para quem vive do <br />
                        <span className="text-bee-amber italic font-medium inline-block md:whitespace-nowrap">movimento.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-16">
                        Seja você um Personal Trainer independente ou o dono de uma rede de academias, o BeeGym se adapta ao seu fluxo de trabalho.
                    </p>
                </div>

                <Audiences />

                <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-bee-midnight rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 leading-tight">
                            Mais do que um sistema, o seu parceiro de crescimento.
                        </h2>
                        <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-lg">
                            Entendemos as dores do mercado fitness. Por isso, criamos uma ferramenta que não apenas organiza, mas impulsiona seu faturamento e profissionalismo.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/register">
                                <Button size="lg" className="bg-bee-amber hover:bg-bee-orange text-bee-midnight font-bold rounded-full px-10 h-14 text-lg w-full sm:w-auto">
                                    Experimentar Grátis
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="relative h-[400px] lg:h-full min-h-[400px] flex items-center justify-center">
                        <div className="w-full h-full bg-slate-800/50 rounded-3xl border border-white/10 flex items-center justify-center text-white/20 font-display text-2xl font-bold uppercase tracking-widest rotate-3 animate-float">
                            [Success Story Visual]
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-2xl text-bee-midnight max-w-xs animate-float" style={{ animationDelay: '1s' }}>
                            <p className="text-sm italic font-medium mb-4">"O BeeGym mudou a forma como gerencio meu Studio. Hoje tenho 3x mais tempo para focar na aula."</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-bee-amber"></div>
                                <div>
                                    <p className="text-xs font-bold">Ricardo Silva</p>
                                    <p className="text-[10px] text-slate-500">Studio Fit Life</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
