import { supabaseAdmin } from '@/lib/supabase/admin';

export interface SaasPlan {
    id: string;
    name?: string;
    tier: string;
    price: number;
    efi_plan_id_hml?: number;
    efi_plan_id_prd?: number;
}

export const SupabaseSaasPlanRepository = {
    async findByTier(tier: string): Promise<SaasPlan | null> {
        const { data, error } = await supabaseAdmin
            .from('saas_plans')
            .select('*')
            .eq('tier', tier.toUpperCase())
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            tier: data.tier,
            price: Number(data.price),
            efi_plan_id_hml: data.efi_plan_id_hml || undefined,
            efi_plan_id_prd: data.efi_plan_id_prd || undefined
        };
    },

    async findById(id: string): Promise<SaasPlan | null> {
        const { data, error } = await supabaseAdmin
            .from('saas_plans')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            tier: data.tier,
            price: Number(data.price),
            efi_plan_id_hml: data.efi_plan_id_hml || undefined,
            efi_plan_id_prd: data.efi_plan_id_prd || undefined
        };
    },

    async updatePrice(id: string, newPrice: number): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('saas_plans')
            .update({
                price: newPrice,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('[SupabaseSaasPlanRepository.updatePrice] Erro:', error);
            return false;
        }
        return true;
    }
};
