import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Construction } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getServerPlan } from '@/lib/server-plan';
import { isOrgAdmin } from '@/lib/auth/role-checks';

export default async function InstructorsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

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

    if (!canManage && (!isActive || !plan.allowedFeatures.includes('multiplos_usuarios'))) {
        redirect('/app/configuracoes');
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Instrutores & Professores"
                subtitle="Gerencie sua equipe técnica e qualificações"
            />

            <Card className="rounded-[2rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 text-bee-amber">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-deep-midnight tracking-tight font-display">Cadastro de Instrutores</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">Funcionalidade em Desenvolvimento</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                            Em breve você poderá cadastrar instrutores, definir especialidades e gerenciar horários.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
