import { createClient } from '@/lib/supabase/server';
import { TeamList } from '@/components/configuracoes/team/team-list';
import { redirect } from 'next/navigation';
import { getServerPlan } from '@/lib/server-plan';
import { SectionHeader } from '@/components/ui/section-header';
import { isOrgAdmin } from '@/lib/auth/role-checks';

export default async function TeamPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // BUSCA NA FONTE DE VERDADE
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        // Handle case where user has no organization (e.g., redirect or show error)
        return <div className="p-8 text-center text-muted-foreground">Erro: Usuário sem organização vinculada no banco de dados.</div>;
    }

    const { plan, isActive } = await getServerPlan(profile.organization_id);

    const canManage = isOrgAdmin((profile as any).role);

    if (!canManage && (!isActive || !plan.allowedFeatures.includes('multiplos_usuarios'))) {
        redirect('/app/configuracoes');
    }

    // Fetch team members from profiles
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('full_name');

    // Equipe shows users whose primary role grants administrative/system access:
    // OWNER, ADMIN, MANAGER, STAFF (recepcionista/financeiro/etc).
    // Instructor-only people (role === 'INSTRUCTOR') live on the /instructors page.
    // Instructors who also have an admin role still appear here under their admin role.
    const filteredMembers = (teamMembers || []).filter((m: any) => {
        const role = (m.role || '').toUpperCase();
        return role !== 'INSTRUCTOR';
    });

    const mappedMembers = filteredMembers.map((m: any) => ({
        ...m,
        name: m.full_name,
        active: m.status === 'ACTIVE',
    }));

    return (
        <TeamList
            initialUsers={mappedMembers}
            currentOrgId={profile.organization_id}
            currentUserId={user.id}
        />
    );
}
