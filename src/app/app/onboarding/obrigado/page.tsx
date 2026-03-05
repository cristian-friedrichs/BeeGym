'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, Mail, PhoneCall } from 'lucide-react'

export default function OnboardingObrigado() {
    const router = useRouter()

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20 p-4 md:p-8">
            <div className="max-w-2xl mx-auto w-full my-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                        <span className="text-white font-black text-xl">B</span>
                    </div>
                    <span className="font-black text-2xl text-slate-800 tracking-tight">BeeGym</span>
                </div>

                <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white/80 backdrop-blur-sm">
                    <div className="h-2 bg-orange-600 w-full" />
                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-100">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-black text-slate-900 mb-2">
                            Recebemos sua solicitação!
                        </CardTitle>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Obrigado pelo interesse no plano <strong className="text-orange-600 uppercase">Enterprise</strong>. Nossa equipe entrará em contato em breve para apresentar uma proposta personalizada.
                        </p>
                    </CardHeader>

                    <CardContent className="px-10 pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                                <Clock className="w-6 h-6 text-orange-600 mb-3" />
                                <h4 className="font-bold text-sm text-slate-800 mb-1">Prazo</h4>
                                <p className="text-[11px] text-slate-500">Retorno em até 24h úteis</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                                <Mail className="w-6 h-6 text-orange-600 mb-3" />
                                <h4 className="font-bold text-sm text-slate-800 mb-1">E-mail</h4>
                                <p className="text-[11px] text-slate-500">Verifique sua caixa de entrada</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                                <PhoneCall className="w-6 h-6 text-orange-600 mb-3" />
                                <h4 className="font-bold text-sm text-slate-800 mb-1">Contato</h4>
                                <p className="text-[11px] text-slate-500">Iremos ligar para o seu número</p>
                            </div>
                        </div>

                        <div className="mt-10 p-6 rounded-2xl bg-orange-50 border border-orange-100/50">
                            <h4 className="font-black text-orange-900 text-center mb-4 text-sm uppercase tracking-wider">Próximos Passos</h4>
                            <ul className="space-y-3 text-sm text-orange-800/80">
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-orange-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-orange-700">1</div>
                                    <p>Análise do seu perfil de negócio e volume de alunos.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-orange-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-orange-700">2</div>
                                    <p>Reunião de diagnóstico rápida (opcional).</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-orange-200 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-orange-700">3</div>
                                    <p>Apresentação da proposta comercial e liberação do acesso.</p>
                                </li>
                            </ul>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-slate-50 px-10 py-6 border-t border-slate-100 flex justify-center">
                        <Button
                            onClick={() => router.replace('/login')}
                            variant="outline"
                            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-8 py-6 rounded-2xl transition-all"
                        >
                            Voltar para o Login
                        </Button>
                    </CardFooter>
                </Card>

                <p className="text-center text-xs text-slate-400">
                    BeeGym © 2026 · Soluções Inteligentes para Academias e Studios
                </p>
            </div>
        </div>
    )
}
