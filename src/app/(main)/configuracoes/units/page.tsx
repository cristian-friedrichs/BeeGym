import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UnitList } from '@/components/configuracoes/units/unit-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { getPlanById } from '@/config/plans';

export default async function UnitsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get current user's organization from profiles (Source of Truth)
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Erro: Usuário sem organização vinculada.
            </div>
        );
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('subscription_plan, subscription_status')
        .eq('id', profile.organization_id)
        .single();

    const plan = getPlanById(org?.subscription_plan);
    const isActive = org?.subscription_status === 'active' || org?.subscription_status === 'trialing' || !org?.subscription_status;

    if (!isActive || !plan.allowedFeatures.includes('multipropriedade')) {
        redirect('/configuracoes');
    }

    // Fetch units for this organization
    const { data: units } = await supabase
        .from('units')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('is_main', { ascending: false })
        .order('name');

    return (
        <div className="space-y-6">
            <UnitList
                units={units as any[] || []}
                organizationId={profile.organization_id}
            />
        </div>
    );
}
