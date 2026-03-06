import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Background abstract shapes - No cliches! */}
            <div className="absolute top-0 inset-x-0 h-full w-full bg-white -z-10" />
            <div className="absolute top-[-10%] sm:top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-bee-amber/5 blur-[120px] -z-10" />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-bee-orange/5 blur-[120px] -z-10" />

            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 mb-8 shine-effect">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-brand animate-pulse"></span>
                        A plataforma N° 1 para negócios fitness
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-bee-midnight leading-[1.1] mb-6">
                        A plataforma de gestão para <br className="hidden md:block" />
                        <span className="relative whitespace-nowrap">
                            <span className="relative z-10">Personal Trainers</span>
                            <span className="absolute -bottom-2 left-0 right-0 h-3 bg-bee-amber/30 -z-10 rounded-full"></span>
                        </span>
                        {' '}e Academias.
                    </h1>

                    <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Gerencie alunos, treinos, agenda e pagamentos em um único sistema.<br className="hidden md:block" />
                        Mais organização. Mais profissionalismo. Mais controle do seu negócio fitness.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10">
                        <Link href="/register" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto bg-bee-midnight hover:bg-bee-midnight/90 text-white font-bold h-14 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                Crie uma Conta
                            </Button>
                        </Link>
                        <Link href="/login" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-slate-200 hover:border-slate-300 text-bee-midnight font-bold h-14 px-8 rounded-full text-lg bg-transparent transition-all hover:bg-slate-50">
                                Fazer Login
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-brand" />
                            <span>Plataforma completa de gestão</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-brand" />
                            <span>Interface simples e intuitiva</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-brand" />
                            <span>Garantia de devolução 100%</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Mockup - Overlapping visual to break cliché */}
                <div className="mt-20 relative mx-auto max-w-5xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-b from-slate-200/50 to-white opacity-50 blur-xl"></div>
                    <div className="relative rounded-[2rem] border border-slate-200/50 bg-white shadow-2xl overflow-hidden animate-float">
                        {/* We will use a placeholder div that looks like a Mac window, until image is updated */}
                        <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-100">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            </div>
                        </div>
                        <div className="aspect-[16/9] w-full bg-slate-50 relative overflow-hidden">
                            {/* Dashboard content wrapper, to inject screenshot later */}
                            <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-400 bg-slate-100">
                                <p className="font-medium">Dashboard Screenshot Space</p>
                                <span className="text-sm">(Insira a imagem real no src/public)</span>
                            </div>
                        </div>
                    </div>
                    {/* Overlapping small widgets for depth */}
                    <div className="absolute -right-8 top-1/3 hidden lg:block rounded-2xl border border-slate-200/50 bg-white p-4 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-brand/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-brand" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-bee-midnight">Pagamento Aprovado</p>
                                <p className="text-xs text-slate-500">Há 2 minutos</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -left-8 bottom-1/4 hidden lg:block rounded-2xl border border-slate-200/50 bg-white p-4 shadow-xl animate-float" style={{ animationDelay: '1.5s' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-bee-amber flex items-center justify-center text-bee-midnight font-bold">
                                +5
                            </div>
                            <div>
                                <p className="text-sm font-bold text-bee-midnight">Novos Alunos</p>
                                <p className="text-xs text-slate-500">Esta semana</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
