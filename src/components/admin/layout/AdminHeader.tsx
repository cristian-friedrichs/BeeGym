'use client';

import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

const pageTitles: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/contratantes': 'Contratantes',
    '/admin/planos': 'Planos',
};

export function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [userName, setUserName] = useState('Admin');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const pageTitle = Object.entries(pageTitles).find(([key]) =>
        pathname.startsWith(key)
    )?.[1] ?? 'Admin';

    useEffect(() => {
        let isMounted = true;
        async function loadUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || !isMounted) return;
                const { data } = await (supabase as any)
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', user.id)
                    .single();
                if (data && isMounted) {
                    setUserName(data.full_name ?? 'Admin');
                    setAvatarUrl(data.avatar_url ?? null);
                }
            } catch (err: any) {
                if (isMounted && err.name !== 'AbortError') {
                    console.error('Erro ao carregar perfil:', err);
                }
            }
        }
        loadUser();
        return () => { isMounted = false; };
    }, [supabase]);

    const initials = userName
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="h-14 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
            <h1 className="text-lg font-bold text-[#00173F] font-display">{pageTitle}</h1>

            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-[#00173F] leading-none">{userName}</p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">BeeGym Admin</p>
                </div>
                <Avatar className="h-8 w-8 border-2 border-orange-100">
                    <AvatarImage src={avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-orange-100 text-bee-orange text-xs font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <button
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Sair"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
