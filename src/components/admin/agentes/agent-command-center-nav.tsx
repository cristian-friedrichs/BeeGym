'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Building2, CheckSquare, MessageSquareText, TimerReset } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/admin/agentes', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/agentes/departamentos', label: 'Departamentos', icon: Building2 },
    { href: '/admin/agentes/atividades', label: 'Atividades', icon: TimerReset },
    { href: '/admin/agentes/aprovacoes', label: 'Aprovações', icon: CheckSquare },
    { href: '/admin/agentes/reunioes', label: 'Reuniões', icon: MessageSquareText },
];

export function AgentCommandCenterNav() {
    const pathname = usePathname();

    return (
        <div className="flex gap-2 overflow-x-auto rounded-[2rem] border border-white/60 bg-white/40 p-2 shadow-sm backdrop-blur-sm">
            {navItems.map((item) => {
                const isActive = item.href === '/admin/agentes'
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-black uppercase tracking-wider transition-all',
                            isActive
                                ? 'bg-[#0B0F1A] text-white shadow-sm'
                                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B0F1A]'
                        )}
                    >
                        <item.icon className={cn('h-4 w-4', isActive ? 'text-bee-amber' : 'text-slate-400')} />
                        {item.label}
                    </Link>
                );
            })}
        </div>
    );
}
