import { createClient } from '@/lib/supabase/server';
import { PlanList } from '@/components/configuracoes/plans/plan-list';
import { redirect } from 'next/navigation';
import { getServerPlan } from '@/lib/server-plan';
import { SectionHeader } from '@/components/ui/section-header';
import { isOrgAdmin } from '@/lib/auth/role-checks';

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
        .select('organization_id, role')
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

    const { plan, isActive } = await getServerPlan(profile.organization_id);

    if (!isOrgAdmin(profile.role)) {
        redirect('/app/configuracoes');
    }

    const { data: plans, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching plans:', error);
    }

    return (
        <PlanList plans={plans || []} organizationId={profile.organization_id} />
    );
}
