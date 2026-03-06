import { ShieldCheck } from 'lucide-react';

export function Guarantee() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6 md:px-12">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-bee-midnight to-slate-900 rounded-[2rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl animate-fade-in-up">
                    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-bee-amber/20 blur-[100px]" />

                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8 border border-white/20">
                        <ShieldCheck className="w-10 h-10 text-bee-amber" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                        Teste a BeeGym sem risco algum
                    </h2>
                    <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                        Nós confiamos no nosso produto. Se você usar a BeeGym por 7 dias e decidir que a ferramenta não é para você,
                        <strong className="text-white"> devolvemos 100% do seu investimento</strong>. Sem burocracia, sem letrinhas miúdas.
                    </p>
                </div>
            </div>
        </section>
    );
}
