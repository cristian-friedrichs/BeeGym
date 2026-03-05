import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
