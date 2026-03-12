import { FAQ } from '@/components/marketing/FAQ';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FAQPage() {
    return (
        <div className="pt-48 pb-24">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-4xl mx-auto mb-24">
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-bee-midnight tracking-tight mb-8">
                        Tire todas as suas <br />
                        <span className="text-bee-amber italic font-medium inline-block md:whitespace-nowrap">Dúvidas Frequentes.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto mb-16">
                        Tudo o que você precisa saber sobre o BeeGym para começar com tranquilidade.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <FAQ />
                </div>

                <div className="mt-32 text-center bg-slate-50 border border-slate-200 rounded-[3rem] p-12 md:p-20">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-bee-midnight mb-6">Ainda tem dúvidas?</h2>
                    <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                        Nossa equipe de suporte está pronta para te ajudar a escolher o melhor caminho para o seu negócio fitness.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="https://wa.me/seunumerowhatsapp" target="_blank">
                            <Button size="lg" className="bg-emerald-brand hover:bg-emerald-brand/90 text-white font-bold rounded-full px-10 h-14 text-lg w-full sm:w-auto">
                                Falar no WhatsApp
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="lg" variant="outline" className="border-2 border-slate-200 text-bee-midnight font-bold rounded-full px-10 h-14 text-lg w-full sm:w-auto">
                                Criar Conta agora
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
