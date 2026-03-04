import { createClient } from '@/lib/supabase/server';
import { PlanList } from '@/components/configuracoes/plans/plan-list';
import { redirect } from 'next/navigation';
import { getPlanById } from '@/config/plans';

export default async function PlansPage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('Auth error:', authError);
        return <div className="p-8 text-center bg-card rounded-lg border">
            <p className="text-destructive">Erro de autenticação. Por favor, faça login novamente.</p>
        </div>;
    }

    // Get profile to find organization_id
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Profile error:', profileError);
        return <div className="p-8 text-center bg-card rounded-lg border">
            <p className="text-destructive">Erro ao buscar perfil: {profileError.message}</p>
        </div>;
    }

    if (!profile?.organization_id) {
        return <div className="p-8 text-center bg-card rounded-lg border">Organização não encontrada.</div>;
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('subscription_plan, subscription_status')
        .eq('id', profile.organization_id)
        .single();

    const plan = getPlanById(org?.subscription_plan);
    const isActive = org?.subscription_status === 'active' || org?.subscription_status === 'trialing' || !org?.subscription_status;

    if (!isActive || !plan.allowedFeatures.includes('cobranca_automatizada')) {
        redirect('/configuracoes');
    }

    const { data: plans, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true }); // Changed from created_at to name

    if (error) {
        console.error('Error fetching plans:', error);
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PlanList plans={plans || []} organizationId={profile.organization_id} />
        </div>
    );
}
