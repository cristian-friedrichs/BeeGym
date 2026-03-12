'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Package,
    FileBarChart,
    LogOut,
    ShieldCheck,
    Ticket,
    LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BeeGymLogo } from '@/components/ui/beegym-logo';
const navGroups = [
    {
        label: 'Menu Principal',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
            { icon: Users, label: 'Clientes', href: '/admin/contratantes' },
            { icon: Package, label: 'Planos', href: '/admin/planos' },
            { icon: Ticket, label: 'Ofertas', href: '/admin/ofertas' },
            { icon: LifeBuoy, label: 'Suporte', href: '/admin/suporte' },
            { icon: FileBarChart, label: 'Relatórios', href: '/admin/relatorios' },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [mounted, setMounted] = useState(false);
    const [isSignOutLoading, setIsSignOutLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        setIsSignOutLoading(true);
        setTimeout(() => {
            supabase.auth.signOut();
            window.location.href = '/auth/signout';
        }, 300);
    };

    if (!mounted) {
        return <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col flex-shrink-0 h-full" />;
    }

    return (
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col flex-shrink-0 h-full">
            <div className="px-5 py-5 flex items-center justify-between">
                <Link href="/admin/dashboard" className="flex items-center gap-2.5">
                    <BeeGymLogo size="sm" />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150',
                                            isActive
                                                ? 'bg-[#0B0F1A] text-white shadow-sm'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-[#0B0F1A]'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                'h-4 w-4 flex-shrink-0 transition-colors',
                                                isActive ? 'text-[#FFBF00]' : 'text-slate-400 group-hover:text-[#0B0F1A]'
                                            )}
                                        />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
                >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    Sair
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
        </aside>
    );
}
