'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Clock } from 'lucide-react'
import { BeeGymLogo } from '@/components/ui/beegym-logo'

export default function PendingActivation() {
    const { signOut, profile } = useAuth()

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 text-center border border-slate-100 flex flex-col items-center">
                <div className="mb-8">
                    <BeeGymLogo variant="dark" size="lg" />
                </div>

                <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-8 border border-amber-100/50 shadow-sm">
                    <Clock className="w-10 h-10 text-bee-amber" />
                </div>

                <h1 className="text-3xl font-display font-black text-bee-midnight mb-3 tracking-tight">
                    Pagamento em Processamento
                </h1>

                <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                    Olá <span className="text-bee-midnight font-bold">{profile?.full_name || 'Personal'}</span>, recebemos seu pedido! Estamos aguardando a confirmação do pagamento para liberar seu acesso total.
                </p>

                <div className="w-full space-y-6">
                    <Button
                        className="w-full h-12 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold rounded-2xl shadow-sm transition-all"
                        onClick={() => window.location.reload()}
                    >
                        Já paguei, atualizar página
                    </Button>
                    <div className="p-6 bg-slate-50/50 rounded-2xl text-sm text-slate-500 text-left border border-slate-100/80">
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber mt-1.5 flex-shrink-0" />
                                <span>Pagamentos via PIX podem levar alguns minutos para serem confirmados.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber mt-1.5 flex-shrink-0" />
                                <span>Se desejar alterar a forma de pagamento, <a href="/app/onboarding/pagamento" className="text-bee-amber font-bold underline">clique aqui</a>.</span>
                            </li>
                        </ul>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-slate-200 text-bee-midnight font-bold hover:bg-slate-50 hover:text-bee-midnight transition-all"
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da Conta
                    </Button>
                </div>

                <p className="mt-8 text-xs text-slate-400 font-medium">
                    © 2026 BeeGym • Gestão de Academias
                </p>
            </div>
        </div>
    )
}
