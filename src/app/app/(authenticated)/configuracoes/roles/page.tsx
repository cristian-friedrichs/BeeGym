import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RoleList } from '@/components/configuracoes/roles/role-list';
import { getServerPlan } from '@/lib/server-plan';
import type { AppRole } from '@/types/permissions';

export default async function RolesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/app/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) redirect('/app/onboarding');

    const { plan, isActive } = await getServerPlan(profile.organization_id);

    if (!isActive || !plan.allowedFeatures.includes('multiplos_usuarios')) {
        redirect('/app/configuracoes');
    }

    const { data: roles } = await supabase
        .from('app_roles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name') as { data: AppRole[] | null };

    return <RoleList initialRoles={roles || []} organizationId={profile.organization_id} />;
}
