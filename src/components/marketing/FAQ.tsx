'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
    {
        q: 'A BeeGym é difícil de usar?',
        a: 'Não. A plataforma foi criada desde o primeiro dia com o princípio de simplicidade. Sem menus escondidos ou configurações confusas de ERPs antigos.',
    },
    {
        q: 'Preciso instalar algum software?',
        a: 'Zero instalação. A BeeGym roda 100% na nuvem, acessível via navegador do seu celular, tablet ou computador, de qualquer lugar.',
    },
    {
        q: 'O sistema emite notas fiscais automaticamente?',
        a: 'Cobrimos todo o processamento financeiro (cartões, Pix Automático, estornos) via Efí. Emissão de NF está no roadmap.',
    },
    {
        q: 'Posso cancelar quando quiser?',
        a: 'Sim. Sem contratos de fidelidade obscuros. Você cancela a qualquer momento diretamente pelo painel — sem ligar para ninguém.',
    },
    {
        q: 'Meus alunos têm acesso ao portal?',
        a: 'Sim! A BeeGym oferece um portal exclusivo para seus alunos consultarem treinos, efetuarem pagamentos e visualizarem o histórico. Disponível a partir do plano Studio.',
    },
    {
        q: 'O faturamento é realmente automático?',
        a: 'Sim. Com Pix Automático e Cartão Recorrente integrados, você configura uma vez e as cobranças acontecem sozinhas todo mês, com notificações automáticas.',
    },
];

export function FAQ() {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <section id="faq" className="py-28 md:py-36">
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col lg:flex-row gap-16 items-start">
                    {/* Left */}
                    <div className="lg:w-80 shrink-0">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-bee-amber mb-5">FAQ</p>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.05] tracking-tight mb-6">
                            Perguntas frequentes.
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Não encontrou o que procura?{' '}
                            <a href="mailto:suporte@beegym.com.br" className="text-bee-amber font-bold underline underline-offset-2 hover:text-white transition-colors">
                                Fale com a gente
                            </a>
                            .
                        </p>
                    </div>

                    {/* Right — custom accordion */}
                    <div className="flex-1 divide-y divide-white/10 border-t border-white/10">
                        {FAQS.map((faq, i) => (
                            <div key={i} id={`faq-${i}`}>
                                <button
                                    className="w-full flex items-center justify-between gap-6 py-6 text-left group"
                                    onClick={() => setOpen(open === i ? null : i)}
                                    aria-expanded={open === i}
                                >
                                    <span className="text-lg font-bold text-white group-hover:text-bee-amber transition-colors leading-snug">
                                        {faq.q}
                                    </span>
                                    <span className="shrink-0 w-8 h-8 border border-white/20 flex items-center justify-center text-slate-500 group-hover:border-bee-amber group-hover:text-bee-amber transition-all">
                                        {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </span>
                                </button>
                                {open === i && (
                                    <div className="pb-6 text-slate-400 font-medium leading-relaxed text-base">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
