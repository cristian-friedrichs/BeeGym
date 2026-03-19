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

        if (status === 'ATIVO') {
            // 1. Mudar para active (acesso liberado após consentimento)
            await assinaturaRepository.updateStatus(assinatura.id, 'active');

            // 2. Liberar acesso real no Supabase
            await contratanteRepository.liberarAcesso(assinatura.contratanteId);

            return;
        }

        if (status === 'CANCELADO_PELO_PAGADOR' || status === 'EXPIRADO') {
            await assinaturaRepository.updateStatus(assinatura.id, 'canceled');
            console.warn(`[Pix-Auto-Consent] Acordo ${acordoId} foi cancelado ou expirou.`);
        }
    }
}
