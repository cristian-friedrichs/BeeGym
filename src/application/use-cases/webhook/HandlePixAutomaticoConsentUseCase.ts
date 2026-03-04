import { SupabaseAssinaturaRepository as assinaturaRepository } from '../../repositories/SupabaseAssinaturaRepository';
import { SupabaseContratanteRepository as contratanteRepository } from '../../repositories/SupabaseContratanteRepository';

export class HandlePixAutomaticoConsentUseCase {
    /**
     * Executado quando o aluno aceita o Pix Automático em seu app (webhook consentimento).
     */
    async execute(acordoId: string, status: string): Promise<void> {
        const assinatura = await assinaturaRepository.findByAcordoId(acordoId);

        if (!assinatura) {
            console.warn(`[Pix-Auto-Consent] Acordo ${acordoId} não encontrado no banco.`);
            return;
        }

        // Se já está ativo/trial, ignora (idempotência)
        if (assinatura.status === 'TRIAL' || assinatura.status === 'ATIVO') {
            if (status === 'ATIVO') return;
        }

        if (status === 'ATIVO') {
            console.log(`[Pix-Auto-Consent] Consentimento ATIVO para acordo ${acordoId}. Liberando acesso.`);

            // 1. Mudar para TRIAL (primeiros 7 dias ou acesso inicial)
            await assinaturaRepository.updateStatus(assinatura.id, 'TRIAL');

            // 2. Liberar acesso real no Supabase
            await contratanteRepository.liberarAcesso(assinatura.contratanteId);

            console.info(`[Pix-Auto-Consent] Assinatura ${assinatura.id} ativada com sucesso.`);
            return;
        }

        if (status === 'CANCELADO_PELO_PAGADOR' || status === 'EXPIRADO') {
            await assinaturaRepository.updateStatus(assinatura.id, 'INATIVO');
            console.warn(`[Pix-Auto-Consent] Acordo ${acordoId} foi cancelado ou expirou.`);
        }
    }
}
