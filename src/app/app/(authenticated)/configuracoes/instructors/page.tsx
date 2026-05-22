import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getServerPlan } from '@/lib/server-plan';
import { isOrgAdmin } from '@/lib/auth/role-checks';
import { InstructorList } from '@/components/configuracoes/instructors/instructor-list';

export default async function InstructorsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return <div className="p-8 text-center text-muted-foreground">Erro: Usuário sem organização vinculada.</div>;
    }

    const { plan, isActive } = await getServerPlan(profile.organization_id);
    const canManage = isOrgAdmin((profile as any).role);
    const hasMultiUser = isActive && plan.allowedFeatures.includes('multiplos_usuarios');

    if (!canManage && !hasMultiUser) {
        redirect('/app/configuracoes');
    }

    // Fetch instructors with their linked profile (if any) to know who has system access
    const { data: instructors } = await supabase
        .from('instructors')
        .select('id, name, bio, user_id, allowed_unit_ids, created_at')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true });

    const instructorIds = (instructors ?? []).map((i: any) => i.id);
    const userIds = (instructors ?? [])
        .map((i: any) => i.user_id)
        .filter((v: any): v is string => !!v);

    // Fetch profiles for linked instructors so we can show email/status
    const { data: linkedProfiles } = userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, email, status, role')
            .in('id', userIds)
        : { data: [] as any[] };

    const profileById = new Map((linkedProfiles ?? []).map((p: any) => [p.id, p]));

    const enriched = (instructors ?? []).map((i: any) => {
        const linked = i.user_id ? profileById.get(i.user_id) : null;
        return {
            ...i,
            has_system_access: !!linked,
            email: linked?.email ?? null,
            account_status: linked?.status ?? null,
            access_role: linked?.role ?? null,
        };
    });

    // Fetch units & roles for the create modal
    const [{ data: units }, { data: roles }] = await Promise.all([
        supabase
            .from('units')
            .select('id, name')
            .eq('organization_id', profile.organization_id)
            .eq('active', true)
            .order('name'),
        supabase
            .from('app_roles')
            .select('id, name')
            .eq('organization_id', profile.organization_id)
            .order('name'),
    ]);

    const canCreateMore = hasMultiUser || (instructors ?? []).length === 0;

    return (
        <InstructorList
            instructors={enriched as any[]}
            units={(units ?? []) as any[]}
            roles={(roles ?? []) as any[]}
            canCreateMore={canCreateMore}
        />
    );
}
