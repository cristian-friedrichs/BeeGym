import { ShieldCheck } from 'lucide-react';

export function Guarantee() {
    return (
        <section id="garantia" className="bg-bee-amber py-20 md:py-24">
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-5xl mx-auto">
                    {/* Icon + label */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                        <div className="w-24 h-24 border-2 border-bee-midnight/20 flex items-center justify-center">
                            <ShieldCheck className="w-12 h-12 text-bee-midnight" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-bee-midnight/60">
                            Garantia 7 dias
                        </span>
                    </div>

                    {/* Text */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-bee-midnight leading-tight mb-4">
                            Sem risco. Sem letrinhas miúdas.
                        </h2>
                        <p className="text-bee-midnight/70 text-lg font-medium leading-relaxed">
                            Testou a BeeGym por 7 dias e decidiu que não é para você?{' '}
                            <strong className="text-bee-midnight">Devolvemos 100% do seu investimento.</strong>{' '}
                            Sem perguntas, sem processo, sem burocracia. A nossa garantia é incondicional porque confiamos na plataforma.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
