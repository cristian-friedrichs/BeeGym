'use client';

import { useEffect, useState, Suspense } from 'react';
import QRCode from 'qrcode';
import { useSearchParams } from 'next/navigation';
import {
    Loader2, CheckCircle2, Landmark, ArrowRight,
    RefreshCw, ExternalLink, Clock, Shield, AlertCircle,
    Copy, Check, QrCode as QrCodeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { useToast } from '@/hooks/use-toast';

function ConfirmacaoContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const metodo = searchParams.get('metodo');
    const plano = searchParams.get('plano') || 'BeeGym';
    const preco = parseFloat(searchParams.get('preco') || '0');
    const urlConsentimento = searchParams.get('urlConsentimento');
    const pixCopiaECola = searchParams.get('pixCopiaECola') || (urlConsentimento?.startsWith('000201') ? urlConsentimento : null);
    const acessoLiberado = searchParams.get('acessoLiberado') === '1';
    const statusEfi = searchParams.get('statusEfi');

    const [pixAtivado, setPixAtivado] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (pixCopiaECola) {
            QRCode.toDataURL(pixCopiaECola, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#00173F',
                    light: '#ffffff'
                }
            })
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error('Erro ao gerar QR Code:', err));
        }
    }, [pixCopiaECola]);

    const handleCopyPix = () => {
        if (!pixCopiaECola) return;
        navigator.clipboard.writeText(pixCopiaECola);
        setCopiado(true);
        toast({
            title: 'Código Copiado!',
            description: 'Agora cole no app do seu banco para autorizar.',
        });
        setTimeout(() => setCopiado(false), 2000);
        setTimeout(() => setPixAtivado(true), 5000); // Simulação de progresso
    };

    const precoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(preco);

    const proximaCobranca = (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    })();

    // ─── PIX AUTOMÁTICO ──────────────────────────────────────────
    if (metodo === 'PIX_AUTOMATICO') {
        if (pixAtivado) {
            return (
                <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-green-50/20 p-4 md:p-8 items-center">
                    <div className="max-w-6xl mx-auto w-full space-y-6">
                        <OnboardingProgress currentStep={4} />
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black font-display text-[#00173F]">Aguardando confirmação</h1>
                                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                                    Seu banco confirmará o débito em alguns instantes.
                                    Assim que aprovado, seu acesso ao <strong>{plano}</strong> será liberado automaticamente.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>Primeira cobrança em {proximaCobranca}</span>
                            </div>
                            <Button
                                className="w-full h-12 text-base font-bold bg-bee-orange hover:bg-orange-500 text-white rounded-2xl shadow-orange-200 shadow-md"
                                asChild
                            >
                                <Link href="/painel">
                                    Ir para o painel <ArrowRight className="w-4 h-4 ml-2" />
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
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                            <Landmark className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-black font-display text-[#00173F]">Autorize no seu banco</h1>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                            Clique no botão abaixo para abrir o app do seu banco e autorizar o débito automático
                            mensal de <strong>{precoFormatado}</strong> para o plano <strong>{plano}</strong>.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Como funciona</p>
                        {[
                            { n: '1', text: 'Clique em "Autorizar no banco" abaixo' },
                            { n: '2', text: 'Seu banco abrirá uma página de consentimento PIX' },
                            { n: '3', text: 'Confirme a autorização do débito automático' },
                            { n: '4', text: 'Retorne aqui — seu acesso já estará liberado!' },
                        ].map((step) => (
                            <div key={step.n} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {step.n}
                                </span>
                                <p className="text-sm text-slate-600">{step.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* QR Code Section */}
                    {pixCopiaECola && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                                {qrCodeUrl ? (
                                    <img src={qrCodeUrl} alt="QR Code Pix" className="w-48 h-48 mx-auto" />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                    </div>
                                )}
                            </div>

                            <div className="w-full space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-2 border-slate-100 hover:bg-slate-50 text-[#00173F] font-bold rounded-2xl flex items-center justify-center gap-2"
                                    onClick={handleCopyPix}
                                >
                                    {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    {copiado ? 'Código Copiado!' : 'Copiar código Pix (Copia e Cola)'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {urlConsentimento && !urlConsentimento.startsWith('000201') ? (
                        <div className="space-y-3">
                            <Button
                                className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-blue-100 shadow-md"
                                onClick={() => {
                                    const finalUrl = urlConsentimento.startsWith('http')
                                        ? urlConsentimento
                                        : `https://${urlConsentimento}`;
                                    window.open(finalUrl, '_blank', 'noopener,noreferrer');
                                    setTimeout(() => setPixAtivado(true), 3000);
                                }}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Autorizar no banco (Abrir link)
                            </Button>
                            <p className="text-[10px] text-center text-slate-400">
                                Se o seu banco não abrir automaticamente, use o QR Code acima.
                            </p>
                        </div>
                    ) : !pixCopiaECola && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
                            <strong>Link de autorização não disponível.</strong><br />
                            Verifique seu e-mail ou entre em contato com o suporte.
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Shield className="w-3 h-3" />
                        <span>Autorização segura via Banco Central do Brasil · Cancele quando quiser</span>
                    </div>

                    <div className="text-center">
                        <Button variant="ghost" className="text-xs text-slate-400 h-8" asChild>
                            <Link href="/onboarding/pagamento">
                                <RefreshCw className="w-3 h-3 mr-1.5" />
                                Gerar novo link de autorização
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── CARTÃO RECORRENTE — AGUARDANDO ANÁLISE ──────────────────────
    if (metodo === 'CARTAO_RECORRENTE' && !acessoLiberado) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/20 p-4 md:p-8 items-center">
                <div className="max-w-6xl mx-auto w-full space-y-6">
                    <OnboardingProgress currentStep={4} />
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
                            <Clock className="w-8 h-8 text-amber-600" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-black font-display text-[#00173F]">Pagamento em análise</h1>
                            <p className="text-slate-500 mt-2 text-sm">
                                Sua assinatura do plano <strong>{plano}</strong> foi recebida e está sendo processada pela operadora.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-amber-100 p-4 text-left space-y-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Por segurança, alguns pagamentos passam por uma análise manual que pode levar até 24h.
                                    <strong> Você receberá um e-mail assim que o acesso for liberado.</strong>
                                </p>
                            </div>
                            <div className="border-t border-amber-50 pt-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Status na EFI</span>
                                    <span className="font-bold text-amber-600 uppercase italic">{statusEfi || 'Em análise'}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-bold bg-slate-200 text-slate-600 rounded-2xl cursor-not-allowed"
                            disabled
                        >
                            Aguardando Aprovação...
                        </Button>

                        <Button variant="ghost" className="text-xs text-slate-400 h-8" asChild>
                            <Link href="/onboarding/pagamento">
                                Tentar outro cartão ou método
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── CARTÃO RECORRENTE — APROVADO ──────────────────────
    if (acessoLiberado) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-green-50/20 p-4 md:p-8 items-center">
                <div className="max-w-6xl mx-auto w-full space-y-6">
                    <OnboardingProgress currentStep={4} />
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-black font-display text-[#00173F]">Assinatura confirmada! 🎉</h1>
                            <p className="text-slate-500 mt-2 text-sm">
                                Bem-vindo ao plano <strong>{plano}</strong>. Seu acesso está liberado agora.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Próxima cobrança</span>
                                <span className="font-bold text-[#00173F]">{proximaCobranca}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Valor</span>
                                <span className="font-bold text-bee-orange">{precoFormatado}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Plano</span>
                                <span className="font-bold text-[#00173F]">{plano}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-bold bg-bee-orange hover:bg-orange-500 text-white rounded-2xl shadow-orange-200 shadow-md"
                            asChild
                        >
                            <Link href="/painel">
                                Acessar o BeeGym <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>

                        <p className="text-xs text-slate-400">
                            Cobranças automáticas mensais. Cancele a qualquer momento em Configurações.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Estado de fallback
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
