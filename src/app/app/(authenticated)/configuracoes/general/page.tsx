import { getOrganizationSettings } from '@/actions/organization';
import { GeneralSettingsForm } from '@/components/configuracoes/general-settings-form';
import { AlertCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function GeneralSettingsPage() {
    const { org, error } = await getOrganizationSettings();

    if (error) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive" className="rounded-[2rem] border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro de Conexão</AlertTitle>
                    <AlertDescription>
                        {error}. Certifique-se de que sua conta está devidamente configurada.
                    </AlertDescription>
                </Alert>

                {/* Even on error, we might show a disabled or skeleton form, 
                    but better to guide them to onboarding if orgId is missing */}
                <div className="p-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">
                        Não foi possível carregar as configurações da organização.
                        Isso pode ocorrer se o processo de onboarding não foi concluído.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex-1 p-4 md:p-8 pt-6 pb-20">
            <GeneralSettingsForm org={org} orgId={org.id} />
        </div>
    );
}
