import { UserPlus, Settings, Rocket } from 'lucide-react';

export function HowItWorks() {
    const steps = [
        {
            icon: UserPlus,
            step: "01",
            title: "Crie sua conta estruturada",
            desc: "Em menos de 2 minutos você configura sua vitrine, seus instrutores e os planos que deseja vender.",
        },
        {
            icon: Settings,
            step: "02",
            title: "Cadastre seus alunos",
            desc: "Importe ou cadastre alunos, associe-os aos planos e configure o faturamento automático na hora.",
        },
        {
            icon: Rocket,
            step: "03",
            title: "Comece a escalar",
            desc: "Prescreva treinos, envie faturas e acompanhe os indicadores de crescimento da sua academia.",
        }
    ];

    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6 md:px-12 text-center">
                <h2 className="text-3xl md:text-5xl font-display font-bold text-bee-midnight mb-16 animate-fade-in-up">
                    Como começar usar a BeeGym?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {/* Connector line for desktop */}
                    <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-slate-200 via-bee-amber/50 to-slate-200 -z-10" />

                    {steps.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 border-2 border-slate-100">
                                <span className="text-xl font-display font-bold text-slate-300 absolute -top-4 -left-2">{s.step}</span>
                                <s.icon className="w-8 h-8 text-bee-midnight" />
                            </div>
                            <h3 className="text-2xl font-bold text-bee-midnight mb-4">{s.title}</h3>
                            <p className="text-slate-600 font-medium leading-relaxed max-w-sm">
                                {s.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
