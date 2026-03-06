'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CuponsTable } from '@/components/admin/cupons/CuponsTable';
import { SectionHeader } from '@/components/ui/section-header';

export default function AdminCuponsPage() {
    const [openNew, setOpenNew] = useState(false);

    return (
        <div className="space-y-6 pb-12">
            <SectionHeader
                title="Ofertas"
                subtitle="Crie e gerencie descontos, gratuidades e promoções automáticas"
                action={
                    <Button
                        className="bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold gap-2 shadow-sm"
                        onClick={() => setOpenNew(true)}
                    >
                        <Plus className="w-4 h-4" /> Nova Oferta
                    </Button>
                }
            />
            <CuponsTable externalOpenNew={openNew} onExternalOpenHandled={() => setOpenNew(false)} />
        </div>
    );
}
