import { NextResponse } from 'next/server';
// @ts-ignore
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CancelSubscriptionUseCase } from '@/application/use-cases/subscription/CancelSubscriptionUseCase';

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const organizationId = session.user.user_metadata?.organization_id;

        if (!organizationId) {
            return NextResponse.json({ error: 'Organização não encontrada na sessão' }, { status: 400 });
        }

        const useCase = new CancelSubscriptionUseCase();
        const result = await useCase.execute({
            organizationId
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Subscription Cancel] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
