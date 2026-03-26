'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BeeGymLogo } from '@/components/ui/beegym-logo'

export default function DebugAuthPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function getDebugData() {
            const { data: { user } } = await supabase.auth.getUser()
            
            let profile = null
            let org = null

            if (user) {
                const { data: p } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single()
                profile = p

                if (profile?.organization_id) {
                    const { data: o } = await (supabase as any).from('organizations').select('*').eq('id', profile.organization_id).single()
                    org = o
                }
            }

            setData({ user, profile, org })
            setLoading(false)
        }
        getDebugData()
    }, [])

    if (loading) return <div className="p-20 text-center font-bold">Carregando diagnóstico...</div>

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 font-mono text-sm bg-slate-50 min-h-screen">
            <div className="flex justify-center mb-8">
                <BeeGymLogo variant="light" size="lg" />
            </div>
            
            <h1 className="text-2xl font-bold font-sans">Diagnóstico de Acesso</h1>

            <section className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-bold mb-4 text-blue-600">Sessão Auth (JWT)</h2>
                <pre className="overflow-auto max-h-60 p-4 bg-slate-900 text-slate-100 rounded-lg">
                    {JSON.stringify(data.user, null, 2)}
                </pre>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-bold mb-4 text-emerald-600">Perfil (Banco de Dados)</h2>
                <pre className="overflow-auto max-h-60 p-4 bg-slate-900 text-slate-100 rounded-lg">
                    {JSON.stringify(data.profile, null, 2)}
                </pre>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-bold mb-4 text-orange-600">Organização (Banco de Dados)</h2>
                <pre className="overflow-auto max-h-60 p-4 bg-slate-900 text-slate-100 rounded-lg">
                    {JSON.stringify(data.org, null, 2)}
                </pre>
            </section>

            <div className="text-center pt-8">
                <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-6 py-3 bg-bee-amber text-bee-midnight font-bold rounded-lg uppercase tracking-wider"
                >
                    Voltar ao Login
                </button>
            </div>
        </div>
    )
}
