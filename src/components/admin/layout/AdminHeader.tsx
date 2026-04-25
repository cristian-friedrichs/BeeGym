'use client';

import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Bell, ChevronDown } from 'lucide-react';

const pageMeta: Record<string, { title: string; subtitle: string }> = {
    '/admin/dashboard': { title: 'Dashboard', subtitle: 'Visão geral da plataforma' },
    '/admin/contratantes': { title: 'Clientes', subtitle: 'Gerencie clientes e assinaturas' },
    '/admin/planos': { title: 'Planos', subtitle: 'Configure planos de assinatura' },
    '/admin/cupons': { title: 'Ofertas', subtitle: 'Gerencie descontos e promoções' },
    '/admin/relatorios': { title: 'Relatórios', subtitle: 'Análises e exportações' },
    '/admin/webhooks': { title: 'Webhooks', subtitle: 'Monitoramento de integrações' },
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

export function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [userName, setUserName] = useState('Admin');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isSignOutLoading, setIsSignOutLoading] = useState(false);

    const meta = Object.entries(pageMeta).find(([key]) =>
        pathname.startsWith(key)
    )?.[1] ?? { title: 'Admin', subtitle: 'Painel administrativo' };

    const isDashboard = pathname.startsWith('/admin/dashboard');

    useEffect(() => {
        setMounted(true);
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
        setIsSignOutLoading(true);
        setTimeout(() => {
            supabase.auth.signOut();
            window.location.href = '/auth/signout';
        }, 300);
    };

    return (
        <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 flex-shrink-0 gap-4">

            {/* Left: Search */}
            <div className="flex-1 max-w-md hidden sm:block">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10 transition-all font-sans placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Mobile Search Button */}
                <button className="sm:hidden flex items-center gap-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 transition-colors text-sm font-medium">
                    <Search className="w-3.5 h-3.5" />
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-100 mx-1" />

                {/* User */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 p-1 hover:bg-slate-50 rounded-xl transition-colors group"
                    title="Sair"
                >
                    <Avatar className="h-8 w-8 border-2 border-amber-100">
                        <AvatarImage src={avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-amber-50 text-amber-600 text-xs font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                        <p className="text-[13px] font-semibold text-[#0B0F1A] leading-none">{userName.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Admin</p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-300 hidden sm:block" />
                </button>
            </div>
            {isSignOutLoading && (
                <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-amber-500/20 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-sm font-bold text-slate-900 animate-pulse uppercase tracking-widest">Saindo...</p>
                    </div>
                </div>
            )}
        </header>
    );
}
