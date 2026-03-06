import Image from 'next/image';
import { CheckCircle2, TrendingUp, Clock, ShieldCheck } from 'lucide-react';

export function Benefits() {
    return (
        <section className="py-24 md:py-32 bg-white overflow-hidden">
            <div className="container mx-auto px-6 md:px-12">
                <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-bee-midnight tracking-tight mb-6">
                        Mais organização para quem <span className="text-bee-amber">vive do fitness</span>
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        A BeeGym não é apenas um software, é o motor de crescimento para o seu negócio. Entregamos resultados, não apenas funções.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="order-2 lg:order-1 relative">
                        <div className="absolute inset-0 bg-emerald-brand/5 blur-3xl rounded-full translate-x-10 translate-y-10 -z-10" />
                        <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-slate-50 border border-slate-100 shadow-2xl overflow-hidden flex items-center justify-center text-slate-300 font-medium">
                            Illustração / Mockup de Desempenho
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 flex flex-col justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <Clock className="w-6 h-6 text-bee-midnight" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-display font-bold text-bee-midnight mb-6">
                            Economize Tempo
                        </h3>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Automatize tarefas administrativas como cobranças, envio de recibos e lembretes de aula. Recupere as horas perdidas em planilhas para focar no que importa: <strong className="text-bee-midnight font-bold">seus alunos</strong>.
                        </p>
                        <ul className="space-y-4 text-slate-700 font-medium">
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-brand" /> Faturamento Automático (Pix e Cartão)</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-brand" /> Controle Ágil da Agenda</li>
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className="flex flex-col justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <TrendingUp className="w-6 h-6 text-bee-midnight" />
                        </div>
                        <h3 className="text-3xl md:text-4xl font-display font-bold text-bee-midnight mb-6">
                            Escale sem perder o controle
                        </h3>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Gerencie mais alunos entregando uma experiência premium. Profissionalize seu serviço com fichas atualizadas, avaliações organizadas e um portal moderno para seus clientes.
                        </p>
                        <ul className="space-y-4 text-slate-700 font-medium">
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-brand" /> Hub online para os alunos</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-brand" /> Retenção através do acompanhamento</li>
                        </ul>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-bee-amber/5 blur-3xl rounded-full -translate-x-10 translate-y-10 -z-10" />
                        <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-slate-50 border border-slate-100 shadow-2xl overflow-hidden flex items-center justify-center text-slate-300 font-medium">
                            Illustração / Mockup de Visão do Aluno
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
