import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function BannerCTA() {
    return (
        <section className="py-32 bg-white text-center">
            <div className="container mx-auto px-6 md:px-12">
                <h2 className="text-4xl md:text-6xl font-display font-bold text-bee-midnight tracking-tight mb-8 animate-fade-in-up">
                    Organize seu negócio fitness hoje.
                </h2>
                <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    Personal trainers, studios e academias precisam de gestão profissional.<br className="hidden md:block" /> A BeeGym foi criada para isso.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <Link href="/register" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto bg-bee-amber text-bee-midnight font-bold h-14 px-10 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all duration-300">
                            Crie uma Conta – É Rápido
                        </Button>
                    </Link>
                    <Link href="/login" className="w-full sm:w-auto">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-slate-200 text-bee-midnight font-bold h-14 px-10 rounded-full text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                            Já sou cliente
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
