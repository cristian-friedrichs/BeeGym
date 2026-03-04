import { NextRequest, NextResponse } from 'next/server';

// Mocks in-memory (substituir por UpdatePlanUseCase / DeletePlanUseCase)
const CONTAGEM_ASSINANTES: Record<string, number> = {
    'plan-1': 87,
    'plan-2': 65,
    'plan-3': 35,
};

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();
    // Aqui chamaremos UpdatePlanUseCase
    return NextResponse.json({ id, ...body, updated: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const assinantes = CONTAGEM_ASSINANTES[id] ?? 0;

    if (assinantes > 0) {
        return NextResponse.json(
            { error: `Não é possível remover. ${assinantes} assinante(s) ativo(s) neste plano.` },
            { status: 409 }
        );
    }

    // Aqui chamaremos DeletePlanUseCase
    return NextResponse.json({ success: true });
}
