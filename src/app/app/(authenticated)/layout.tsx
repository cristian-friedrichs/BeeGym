'use client';
import type { ReactNode } from "react";
import { Sidebar } from "@/components/painel/sidebar";
import { Header } from "@/components/painel/header";
import { BottomBar } from "@/components/painel/bottom-bar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UnitProvider } from "@/context/UnitContext";
import { StatusAutomator } from "@/components/global/status-automator";
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // O Middleware já deve ter redirecionado, mas por garantia:
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    };

    checkAccess();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-bee-amber" />
      </div>
    );
  }

  return (
    <UnitProvider>
      <StatusAutomator />
      <div className="flex h-[100dvh] w-full bg-background-light dark:bg-background-dark overflow-hidden">
        <Sidebar className="flex-shrink-0" />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header className="flex-shrink-0" />
          <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto overflow-x-hidden pb-20 md:pb-6 relative">
            {children}
          </main>
          <BottomBar />
        </div>
      </div>
    </UnitProvider>
  );
}
