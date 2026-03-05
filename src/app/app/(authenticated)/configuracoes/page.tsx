import { redirect } from 'next/navigation';

export default function SettingsRootPage() {
    redirect('/app/configuracoes/general');
}
