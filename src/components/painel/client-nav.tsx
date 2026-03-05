'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    User,
    Activity,
    CreditCard,
    Ruler,
    Dumbbell
} from 'lucide-react';

const navItems = [
    {
        title: "Perfil",
        href: "", // Root of [id]
        icon: User,
        matchExact: true
    },
    {
        title: "Frequência",
        href: "/frequency",
        icon: Activity
    },
    {
        title: "Treinos",
        href: "/treinos",
        icon: Dumbbell
    },
    {
        title: "Financeiro",
        href: "/pagamentos",
        icon: CreditCard
    },
    {
        title: "Medidas",
        href: "/measurements",
        icon: Ruler
    }
];

interface ClientNavProps {
    studentId: string;
}

export function ClientNav({ studentId }: ClientNavProps) {
    const pathname = usePathname();
    const baseUrl = `/app/painel/alunos/${studentId}`;

    return (
        <nav className="flex items-center space-x-4 lg:space-x-6 overflow-x-auto pb-2 border-b">
            {navItems.map((item) => {
                const fullHref = `${baseUrl}${item.href}`;
                const isActive = item.matchExact
                    ? pathname === fullHref
                    : pathname.startsWith(fullHref);

                return (
                    <Link
                        key={item.href}
                        href={fullHref}
                        className={cn(
                            "text-sm font-medium transition-colors flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted",
                            isActive
                                ? "text-primary border-b-2 border-primary rounded-none px-0 pb-1.5 hover:bg-transparent"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                )
            })}
        </nav>
    );
}
