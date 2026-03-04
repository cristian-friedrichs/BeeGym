'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Clock } from 'lucide-react'

export default function PendingActivation() {
    const { signOut, profile } = useAuth()

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-amber-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Conta em Análise
                </h1>

                <p className="text-slate-600 mb-8">
                    Olá {profile?.full_name || 'Personal'}, sua conta para a organização está aguardando ativação pelo administrador ou está em processo de onboarding.
                </p>

                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-left border border-slate-100">
                        <p>• Verifique se você completou seu cadastro.</p>
                        <p>• Entre em contato com o suporte se o atraso persistir.</p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da Conta
                    </Button>
                </div>
            </div>
        </div>
    )
}
