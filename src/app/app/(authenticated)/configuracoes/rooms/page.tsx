import { createClient } from '@/lib/supabase/server';
import { RoomList } from '@/components/configuracoes/rooms/room-list';
import { SectionHeader } from '@/components/ui/section-header';
import { redirect } from 'next/navigation';
import { getServerPlan } from '@/lib/server-plan';

export default async function RoomsPage() {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return <div className="p-8 text-center bg-card rounded-lg border text-destructive">Erro de autenticação.</div>;
    }

    // 2. Organization Check
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (profileError || !profile?.organization_id) {
        console.error('Profile error:', profileError);
        return redirect('/app/onboarding');
    }

    const { plan, isActive } = await getServerPlan(profile.organization_id);

    const isMasterAdmin = user.email?.toLowerCase() === 'cristian_friedrichs@live.com' ||
        (profile as any).role === 'ADMIN' ||
        (profile as any).role === 'BEEGYM_ADMIN';

    if (!isMasterAdmin && (!isActive || !plan.allowedFeatures.includes('salas'))) {
        redirect('/app/configuracoes');
    }

    // 3. Fetch Units first (Active units for this Org)
    const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('active', true)
        .order('is_main', { ascending: false });

    if (unitsError) {
        console.error('Error fetching units:', unitsError);
        return <div className="p-8 text-center bg-card rounded-lg border text-destructive">Erro ao carregar unidades: {unitsError.message}</div>;
    }

    const unitIds = units.map(u => u.id);

    // 4. Fetch Rooms only for these units
    // Se não houver unidades, retorna lista vazia de salas para evitar erro no .in()
    let rooms: any[] = [];
    let roomsError = null;

    if (unitIds.length > 0) {
        const result = await supabase
            .from('rooms')
            .select('*')
            .in('unit_id', unitIds)
            // Tenta ordenar por created_at, mas se falhar (coluna inexistente), não deve quebrar a query inteira se for erro de runtime
            // Mudando para 'name' para garantir estabilidade como solicitado
            .order('name', { ascending: true });

        rooms = result.data || [];
        roomsError = result.error;
    }

    if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        return (
            <div className="p-8 text-center bg-card rounded-lg border">
                <p className="text-destructive">Erro ao carregar salas: {roomsError.message}</p>
                <p className="text-sm text-muted-foreground mt-2">Código: {roomsError.code}</p>
            </div>
        );
    }

    // 5. Data Mapping
    const roomsWithUnitName = rooms.map(room => ({
        ...room,
        unit: units.find(u => u.id === room.unit_id) || { name: 'Unidade Desconhecida' }
    }));

    return (
        <RoomList rooms={roomsWithUnitName} units={units} />
    );
}
