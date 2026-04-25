import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpgradeSubscriptionUseCase } from '@/application/use-cases/subscription/UpgradeSubscriptionUseCase';

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tier } = body;

        if (!tier) {
            return NextResponse.json(
                { error: 'O tier do plano é obrigatório (ex: PLUS)' },
                { status: 400 }
            );
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        const organizationId = profile?.organization_id || user.user_metadata?.organization_id;

        if (!organizationId) {
            return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
        }

        const useCase = new UpgradeSubscriptionUseCase();
        const result = await useCase.execute({
            organizationId,
            newPlanTier: tier,
            userEmail: user.email,
            userName: user.user_metadata?.full_name || user.user_metadata?.name,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Subscription Upgrade] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
