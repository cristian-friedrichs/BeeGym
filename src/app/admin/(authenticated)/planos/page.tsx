'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PlanosTable } from '@/components/admin/planos/PlanosTable';
import { SectionHeader } from '@/components/ui/section-header';

export default function AdminPlanosPage() {
    const [openNew, setOpenNew] = useState(false);

    return (
        <div className="space-y-6 pb-12">
            <SectionHeader
                title="Planos"
                subtitle="Gerencie os planos da plataforma"
                action={
                    <>
                        <Button
                            className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold gap-2 shadow-sm"
                            onClick={() => setOpenNew(true)}
                        >
                            <Plus className="w-4 h-4" /> Novo Plano
                        </Button>
                    </>
                }
            />

            <div className="relative">
                <div className="absolute -top-4 -left-4 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-30 pointer-events-none" />
                <PlanosTable externalOpenNew={openNew} onExternalOpenHandled={() => setOpenNew(false)} />
            </div>
        </div>
    );
}
