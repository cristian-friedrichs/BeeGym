import { supabaseAdmin } from '@/lib/supabase/admin';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_MONTHS' | 'FIXED_PRICE_FOR_MONTHS';

export interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discount_type: DiscountType;
    discount_value: number;
    duration_months: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const SupabaseCouponRepository = {
    async create(data: Omit<Coupon, 'id' | 'created_at' | 'updated_at'>): Promise<Coupon> {
        const { data: coupon, error } = await supabaseAdmin
            .from('saas_coupons')
            .insert({
                code: data.code.toUpperCase(),
                description: data.description,
                discount_type: data.discount_type,
                discount_value: data.discount_value,
                duration_months: data.duration_months,
                is_active: data.is_active
            })
            .select()
            .single();

        if (error) {
            console.error('[SupabaseCouponRepository.create] Erro:', error);
            throw new Error('Falha ao criar cupom: ' + error.message);
        }

        return coupon as unknown as Coupon;
    },

    async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
        const { data: coupon, error } = await supabaseAdmin
            .from('saas_coupons')
            .update({
                ...data,
                ...(data.code ? { code: data.code.toUpperCase() } : {}),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[SupabaseCouponRepository.update] Erro:', error);
            throw new Error('Falha ao atualizar cupom: ' + error.message);
        }

        return coupon as unknown as Coupon;
    },

    async findById(id: string): Promise<Coupon | null> {
        const { data, error } = await supabaseAdmin
            .from('saas_coupons')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data as Coupon;
    },

    async findByCode(code: string): Promise<Coupon | null> {
        const { data, error } = await supabaseAdmin
            .from('saas_coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !data) return null;
        return data as unknown as Coupon;
    },

    async listAll(): Promise<Coupon[]> {
        const { data, error } = await supabaseAdmin
            .from('saas_coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[SupabaseCouponRepository.listAll] Erro:', error);
            return [];
        }

        return (data || []) as unknown as Coupon[];
    }
};
