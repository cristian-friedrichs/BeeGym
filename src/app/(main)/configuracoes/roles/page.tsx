import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RoleList } from '@/components/configuracoes/roles/role-list';
import { getPlanById } from '@/config/plans';
import type { AppRole } from '@/types/permissions';

export default async function RolesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) redirect('/onboarding');

    const { data: org } = await supabase
        .from('organizations')
        .select('subscription_plan, subscription_status')
        .eq('id', profile.organization_id)
        .single();

    const plan = getPlanById(org?.subscription_plan);
    const isActive = org?.subscription_status === 'active' || org?.subscription_status === 'trialing' || !org?.subscription_status;

    if (!isActive || !plan.allowedFeatures.includes('multiplos_usuarios')) {
        redirect('/configuracoes');
    }

    const { data: roles } = await supabase
        .from('app_roles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name') as { data: AppRole[] | null };

    return <RoleList initialRoles={roles || []} organizationId={profile.organization_id} />;
}
