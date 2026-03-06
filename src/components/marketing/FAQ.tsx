import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
    const faqs = [
        {
            question: "A BeeGym é difícil de usar?",
            answer: "Não. A plataforma foi criada desde o primeiro dia com o princípio de simplicidade. Sem menus escondidos ou configurações confusas de ERPs antigos."
        },
        {
            question: "Preciso instalar algum software?",
            answer: "Zero instalação. A BeeGym roda 100% na nuvem, acessível via navegador do seu celular, tablet ou computador, de qualquer lugar."
        },
        {
            question: "O sistema emite notas fiscais automaticamente?",
            answer: "No momento cobrimos todo o processamento financeiro (cartões, PIX automático, estornos) via Efí. A integração direta com prefeituras é um add-on que está no nosso roadmap."
        },
        {
            question: "Posso cancelar quando quiser?",
            answer: "Sim. Sem contratos de fidelidade obscuros. Você pode cancelar a qualquer momento diretamente pelo seu painel."
        },
        {
            question: "Meus alunos têm acesso ao aplicativo?",
            answer: "Sim! A BeeGym fornece acesso exclusivo para seus clientes consultarem treinos, efetuarem os pagamentos e visualizarem o histórico deles de forma transparente."
        }
    ];

    return (
        <section className="py-24 bg-slate-50" id="faq">
            <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-16">
                <div className="md:w-1/3 animate-fade-in-up">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-bee-midnight mb-6">
                        Perguntas<br />Frequentes
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        Tem alguma dúvida que não está aqui? Mande um e-mail para nossa equipe de suporte.
                    </p>
                </div>
                <div className="md:w-2/3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, idx) => (
                            <AccordionItem key={idx} value={`item-${idx}`} className="bg-white border border-slate-200 rounded-2xl px-6 data-[state=open]:border-bee-amber/50 data-[state=open]:shadow-soft transition-all">
                                <AccordionTrigger className="text-left font-bold text-lg text-bee-midnight hover:no-underline py-6">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-600 font-medium text-base leading-relaxed pb-6">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
