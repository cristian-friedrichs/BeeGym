import { createClient } from '@/lib/supabase/server';
import { TeamList } from '@/components/configuracoes/team/team-list';
import { redirect } from 'next/navigation';
import { getServerPlan } from '@/lib/server-plan';
import { SectionHeader } from '@/components/ui/section-header';

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

    const isMasterAdmin = user.email?.toLowerCase() === 'cristian_friedrichs@live.com' ||
        (profile as any).role === 'ADMIN' ||
        (profile as any).role === 'BEEGYM_ADMIN';

    if (!isMasterAdmin && (!isActive || !plan.allowedFeatures.includes('multiplos_usuarios'))) {
        redirect('/app/configuracoes');
    }

    // Fetch team members from profiles
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('full_name');

    // Mapeia para o formato esperado pelo componente Legado/Existente
    const mappedMembers = (teamMembers || []).map(m => ({
        ...m,
        name: m.full_name,
        active: m.status === 'ACTIVE'
    }));

    return (
        <TeamList
            initialUsers={mappedMembers}
            currentOrgId={profile.organization_id}
        />
    );
}
