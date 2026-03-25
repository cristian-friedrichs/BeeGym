import { FAQ } from '@/components/marketing/FAQ';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FAQPage() {
    return (
        <div className="pt-40 pb-24">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">Suporte</p>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight mb-8">
                        Tire todas as suas <br />
                        <span className="text-bee-amber italic font-medium inline-block md:whitespace-nowrap">Dúvidas Frequentes.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
                        Tudo o que você precisa saber sobre o BeeGym para começar com tranquilidade.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <FAQ />
                </div>

                {/* Contact CTA */}
                <div className="mt-28 text-center border border-white/10 bg-white/[0.02] p-12 md:p-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Ainda tem dúvidas?</h2>
                    <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
                        Nossa equipe de suporte está pronta para te ajudar a escolher o melhor caminho para o seu negócio fitness.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="https://wa.me/seunumerowhatsapp" target="_blank">
                            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full px-10 h-14 text-lg w-full sm:w-auto">
                                Falar no WhatsApp
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="border-2 border-white/20 text-white hover:bg-white/5 font-bold rounded-full px-10 h-14 text-lg w-full sm:w-auto">
                                Criar Conta Agora
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
