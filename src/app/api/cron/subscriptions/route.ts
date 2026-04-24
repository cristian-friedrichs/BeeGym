import { NextResponse } from 'next/server';
import { assinaturaRepository, suspenderAcesso, notificacaoService, daysSince } from '@/application/repositories/v2-mocks';

export async function GET(request: Request) {
    // Validação nativa do header de CRON da Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 1. Processar contas em TRIAL (Azul) para ATIVO (Verde) após 7 dias
        // Nota: Precisaremos adicionar um método findInTrial ao repository real depois
        // Simulando fluxo: se existe data de início, contamos os dias.
        // const trials = await assinaturaRepository.findInTrial();
        // let ativadas = 0;
        // for (const trial of trials) {
        //     if (daysSince(trial.createdAt) > 7) {
        //         await assinaturaRepository.updateStatus(trial.id, 'ATIVO');
        //         ativadas++;
        //     }
        // }

        // 2. Processar contas INADIMPLENTES (Vermelho)
        // Corresponde à antiga "EM_CARENCIA"
        const assinaturasInadimplentes = await assinaturaRepository.findInGracePeriod();

        const diasPermitidos = Number(process.env.SUBSCRIPTION_GRACE_PERIOD_DAYS || 3);
        let inativas = 0;

        for (const assinatura of assinaturasInadimplentes) {
            const passedDays = daysSince(assinatura.inicioCarencia);

            if (passedDays >= diasPermitidos) {
                // Prazo esgotado! Cancela a assinatura e bloqueia o Contratante
                await assinaturaRepository.updateStatus(assinatura.id, 'canceled');
                await suspenderAcesso(assinatura.contratanteId);
                await notificacaoService.enviarAcessoSuspenso(assinatura.contratanteId);

                inativas++;
            } else {
                // Continua no prazo: Envia Lembrete de pagamento p/ o admin do contrato
                await notificacaoService.enviarLembretePagamento(assinatura.contratanteId, {
                    diasRestantes: (diasPermitidos - passedDays),
                    metodo: assinatura.metodo
                });
            }
        }

        return NextResponse.json({ success: true, processed: assinaturasInadimplentes.length, suspended: inativas });
    } catch (error) {
        console.error('[CRON: Subscriptions] Erro Crítico:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
