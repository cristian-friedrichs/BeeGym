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
                    Conta em Análise
                </h1>

                <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                    Olá <span className="text-bee-midnight font-bold">{profile?.full_name || 'Personal'}</span>, sua conta está aguardando ativação ou você ainda precisa completar o onboarding.
                </p>

                <div className="w-full space-y-6">
                    <div className="p-6 bg-slate-50/50 rounded-2xl text-sm text-slate-500 text-left border border-slate-100/80">
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber mt-1.5 flex-shrink-0" />
                                <span>Verifique se você completou todas as etapas do cadastro.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber mt-1.5 flex-shrink-0" />
                                <span>Entre em contato com o suporte se o acesso não for liberado em breve.</span>
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
