import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UpgradeSubscriptionUseCase } from '@/application/use-cases/subscription/UpgradeSubscriptionUseCase';

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tier } = body;

        if (!tier) {
            return NextResponse.json({ error: 'O tier do plano é obrigatório (ex: PLUS)' }, { status: 400 });
        }

        const organizationId = session.user.user_metadata?.organization_id;

        if (!organizationId) {
            return NextResponse.json({ error: 'Organização não encontrada na sessão' }, { status: 400 });
        }

        const useCase = new UpgradeSubscriptionUseCase();
        const result = await useCase.execute({
            organizationId,
            newPlanTier: tier
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Subscription Upgrade] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
