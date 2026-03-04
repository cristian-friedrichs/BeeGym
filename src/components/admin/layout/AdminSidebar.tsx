'use client';

import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Package,
    FileBarChart,
    LogOut,
    ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BeeGymLogo } from '@/components/ui/beegym-logo';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Clientes', href: '/admin/contratantes' },
    { icon: Package, label: 'Planos', href: '/admin/planos' },
    { icon: FileBarChart, label: 'Relatórios', href: '/admin/relatorios' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <aside className="hidden md:flex w-60 bg-[#00173F] flex-col flex-shrink-0 h-full">
            {/* Logo + Badge */}
            <div className="p-5 border-b border-white/10">
                <Link href="/admin/dashboard">
                    <BeeGymLogo size="md" variant="dark" />
                </Link>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-2.5 py-0.5">
                    <ShieldAlert className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest">
                        Painel Admin
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all',
                                isActive
                                    ? 'bg-bee-orange text-white shadow-lg shadow-orange-500/20'
                                    : 'text-white/50 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider text-white/40 hover:bg-white/10 hover:text-red-400 transition-all"
                >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    Sair
                </button>
            </div>
        </aside>
    );
}
