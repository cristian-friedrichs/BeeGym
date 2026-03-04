'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  MessageSquare,
  Dumbbell,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/painel' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: Users, label: 'Alunos', href: '/clients' },
  { icon: MessageSquare, label: 'Conversas', href: '/conversas' },
  { icon: ClipboardList, label: 'Aulas', href: '/aulas' },
];

export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-2xl z-20">
      <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/painel' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex flex-col items-center justify-center pt-2 text-center group"
            >
              <div
                className={cn(
                  'p-2 rounded-full transition-colors duration-200',
                  isActive ? 'bg-primary/10' : 'group-hover:bg-muted'
                )}
              >
                <item.icon
                  className={cn(
                    'h-6 w-6',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[11px] font-bold mt-1 tracking-tight',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
