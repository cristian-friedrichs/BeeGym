'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { finalizeOnboardingAction } from '@/actions/onboarding-complete';
import { createClient } from '@/lib/supabase/client';

function ConfirmacaoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPolling, setIsPolling] = useState(true);
    const [isConfirmed, setIsConfirmed] = useState(false);
    
    // Podemos ter um ?success=true ou erro do gateway
    const isSuccessParam = searchParams.get('success') === 'true';

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) return;

                const { data: profile } = (await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single()) as { data: any };

                if (profile?.organization_id) {
                    // Verifica se já existe uma assinatura no banco ou se a org está ativa
                    const { data: subscription } = await supabase
                        .from('saas_subscriptions')
                        .select('status')
                        .eq('organization_id', profile.organization_id)
                        .eq('status', 'active')
                        .maybeSingle();

                    if (subscription) {
                        setIsConfirmed(true);
                        setIsPolling(false);
                        clearInterval(interval);
                        
                        // Finaliza o onboarding
                        await finalizeOnboardingAction();
                    }
                }
            } catch (err) {
                console.error('Erro ao verificar status da assinatura:', err);
            }
        };

        // Verifica imediatamente
        checkStatus();

        // Faz polling a cada 3 segundos esperando o webhook
        if (isPolling) {
            interval = setInterval(checkStatus, 3000);
        }

        // Timeout após 2 minutos (para de piscar e sugere contato)
        const timeout = setTimeout(() => {
            if (isPolling) {
                setIsPolling(false);
                clearInterval(interval);
            }
        }, 120000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isPolling]);

    // Caso o webhook já tenha chegado e validado
    if (isConfirmed) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-green-50/20 p-4 md:p-8 items-center">
                <div className="max-w-6xl mx-auto w-full space-y-6">
                    <OnboardingProgress currentStep={4} />
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-black font-display text-[#0B0F1A]">Assinatura confirmada! 🎉</h1>
                            <p className="text-slate-500 mt-2 text-sm">
                                Recebemos a confirmação da Kiwify. Seu acesso está liberado.
                            </p>
                        </div>

                        <Button
                            className="w-full h-14 max-w-sm mx-auto flex text-base font-bold bg-bee-amber hover:bg-amber-500 text-bee-midnight rounded-full shadow-orange-200 shadow-md"
                            asChild
                        >
                            <Link href="/app/painel">
                                Acessar o Painel BeeGym <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 p-4 md:p-8 items-center">
            <div className="max-w-6xl mx-auto w-full space-y-6">
                <OnboardingProgress currentStep={4} />
                <div className="text-center space-y-6">
                    {isPolling ? (
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-amber-600" />
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl font-black font-display text-[#0B0F1A]">
                            {isPolling ? 'Aguardando confirmação...' : 'Pagamento em processamento'}
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-md mx-auto">
                            {isPolling 
                                ? 'Estamos aguardando a confirmação da Kiwify. Isso geralmente leva apenas alguns segundos.'
                                : 'Seu pagamento está sendo processado. Assim que for compensado, sua conta será ativada e você receberá um e-mail.'}
                        </p>
                    </div>

                    {!isPolling && (
                        <div className="pt-8">
                            <Button
                                className="h-12 px-8 text-base font-bold bg-bee-midnight text-white rounded-full"
                                onClick={async () => {
                                    // Força a finalização para liberar o usuário se ele quiser entrar mesmo sem a assinatura constar
                                    await finalizeOnboardingAction();
                                    router.push('/app/painel');
                                }}
                            >
                                Ir para o Painel
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ConfirmacaoPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        }>
            <ConfirmacaoContent />
        </Suspense>
    );
}
