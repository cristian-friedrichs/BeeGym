import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { efiPlansService } from '@/payments/efi/efi.plans';
import { efiConfig } from '@/payments/efi/efi.config';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function POST(request: NextRequest) {
    const rateLimitResponse = await withRateLimit(request, 5);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(request);
    if ('error' in auth) return auth.error;

    logSecurityEvent('ADMIN_PLAN_SYNC', {
        userId: auth.user.id,
        path: request.nextUrl.pathname,
        action: 'sync_plans_efi'
    });

    try {
        const supabase = supabaseAdmin;

        // 1. Busca todos os planos base ativos
        const { data: planos, error } = await supabase
            .from('saas_plans')
            .select('*')
            .eq('active', true);

        if (error) throw error;
        if (!planos || planos.length === 0) {
            return NextResponse.json({ sincronizados: 0, erros: 0, detalhes: [] });
        }

        let sincronizados = 0;
        let erros = 0;
        let detalhes = [];

        // Verifica o target de HML ou PRD
        const isPrd = efiConfig.ambiente === 'producao';

        // 2. Itera sobre os planos
        for (const plano of planos) {
            const hasHmlId = plano.efi_plan_id_hml !== null && plano.efi_plan_id_hml !== undefined;
            const hasPrdId = plano.efi_plan_id_prd !== null && plano.efi_plan_id_prd !== undefined;

            // Só sincronizamos se não tiver o ID da respectiva ENV
            if ((!isPrd && !hasHmlId) || (isPrd && !hasPrdId)) {
                try {
                    // Cuidado: API de Cobranças da Gerencianet espera o preço por fora ou nao?
                    // A API /v1/plan DEVE criar o plano SEM O PREÇO OBRIGATORIAMENTE,
                    // mas pode precisar de ajustes dependendo do payload.
                    // O payload padrao so tem NOME e INTERVALO (Repeticoes)
                    // Os valores sao enviados no /subscription!

                    const newEfiId = await efiPlansService.criarPlano({
                        name: `BeeGym ${plano.name}`,
                        interval: 1, // mensal
                        repeats: null // indeterminado
                    });

                    // 3. Atualiza o banco com o novo ID recebido
                    const updateField = isPrd ? { efi_plan_id_prd: newEfiId } : { efi_plan_id_hml: newEfiId };

                    await supabase
                        .from('saas_plans')
                        .update(updateField)
                        .eq('id', plano.id);

                    sincronizados++;
                    detalhes.push({ nome: plano.name, hml_id: isPrd ? plano.efi_plan_id_hml : newEfiId, prd_id: isPrd ? newEfiId : plano.efi_plan_id_prd, status: 'ok' });
                } catch (err: any) {
                    erros++;
                    detalhes.push({ nome: plano.name, status: 'erro', motivo: err.message });
                }
            } else {
                // Já estava sincronizado
                detalhes.push({ nome: plano.name, hml_id: plano.efi_plan_id_hml, prd_id: plano.efi_plan_id_prd, status: 'ignorado (já sync)' });
            }
        }

        return NextResponse.json({
            sincronizados,
            erros,
            detalhes
        });
    } catch (err: any) {
        console.error('[Admin Planos Sync] Erro Fatal:', err);
        return NextResponse.json({ error: 'Erro ao sincronizar com a EFI.' }, { status: 500 });
    }
}
