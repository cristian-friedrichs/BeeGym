import { supabaseAdmin } from '@/lib/supabase/admin';

export const SupabaseContratanteRepository = {
    async findById(id: string) {
        const { data: org, error } = await supabaseAdmin
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !org) {
            console.error('[SupabaseContratanteRepository.findById] Erro:', error);
            throw new Error('Organização não encontrada');
        }

        return org;
    },

    async updateBasicInfo(id: string, data: { name?: string; phone?: string; address?: string; document?: string }) {
        const { error } = await supabaseAdmin
            .from('organizations')
            .update({
                name: data.name,
                phone: data.phone,
                address: data.address,
                document: data.document,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('[SupabaseContratanteRepository.updateBasicInfo] Erro:', error);
            return false;
        }

        return true;
    },

    async updateStatus(id: string, status: string) {
        const { error } = await supabaseAdmin
            .from('organizations')
            .update({
                subscription_status: status.toLowerCase(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('[SupabaseContratanteRepository.updateStatus] Erro:', error);
            return false;
        }

        return true;
    },

    /**
     * Libera o acesso total ao sistema e marca onboarding como concluído.
     */
    async liberarAcesso(organizationId: string): Promise<void> {
        console.log(`[SupabaseContratanteRepository] Liberando acesso para ${organizationId}`);

        // 1. Atualizar organização
        const { error: orgError } = await supabaseAdmin
            .from('organizations')
            .update({
                subscription_status: 'active',
                onboarding_completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', organizationId);

        if (orgError) {
            throw new Error(`Erro ao liberar acesso (org): ${orgError.message}`);
        }

        // 2. Ativar todos os profiles associados
        const { error: profError } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'ACTIVE' })
            .eq('organization_id', organizationId);

        if (profError) {
            console.error('[SupabaseContratanteRepository] Erro ao ativar perfis:', profError);
        }
    }
};
