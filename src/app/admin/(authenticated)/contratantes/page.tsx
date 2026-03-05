'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ContratantesTable } from '@/components/admin/contratantes/ContratantesTable';
import { SectionHeader } from '@/components/ui/section-header';

export default function AdminContratantesPage() {
    const [openNew, setOpenNew] = useState(false);

    return (
        <div className="space-y-6 pb-12">
            <SectionHeader
                title="Clientes"
                subtitle="Gerencie clientes, assinaturas e status do app"
                action={
                    <Button
                        className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold gap-2 shadow-sm"
                        onClick={() => setOpenNew(true)}
                    >
                        <Plus className="w-4 h-4" /> Novo Cliente
                    </Button>
                }
            />
            <ContratantesTable externalOpenNew={openNew} onExternalOpenHandled={() => setOpenNew(false)} />
        </div>
    );
}
