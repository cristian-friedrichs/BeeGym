'use client';

import { ContratanteDrawer } from '@/components/admin/contratantes/ContratanteDrawer';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function ContratanteDetailPage({ params }: Props) {
    const { id } = use(params);
    const router = useRouter();

    return (
        <ContratanteDrawer
            id={id}
            onClose={() => router.push('/admin/contratantes')}
        />
    );
}
