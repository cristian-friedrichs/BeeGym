import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CancelSubscriptionUseCase } from '@/application/use-cases/subscription/CancelSubscriptionUseCase';

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        const organizationId = profile?.organization_id || user.user_metadata?.organization_id;

        if (!organizationId) {
            return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 });
        }

        const useCase = new CancelSubscriptionUseCase();
        const result = await useCase.execute({ organizationId });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Subscription Cancel] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
