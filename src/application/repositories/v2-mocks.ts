/**
 * Mocks Temporários para permitir a compilação dos Casos de Uso da V2
 * Substituir pelas implementações reais do Prisma/Supabase na Fase de Integração com BD.
 */

import { MetodoPagamento, AssinaturaStatus } from './SupabaseAssinaturaRepository';

export interface Assinatura {
    id: string;
    contratanteId: string;
    planoId: string;
    metodo: MetodoPagamento;
    status: AssinaturaStatus;
    diaVencimento: number;
    valorMensal: number;
    proximoVencimento?: Date;
    inicioCarencia?: Date;
}

export const contratanteRepository = {
    findById: async (id: string) => ({ id, nome: "Contratante Mock" })
};

export const planoRepository = {
    findById: async (id: string) => ({
        id,
        nome: `Plano ${id}`,
        valorMensal: "120.00",
        valorCentavos: 12000
    })
};

export const assinaturaRepository = {
    create: async (data: Partial<Assinatura>) => ({ id: "mock-sub-123", ...data } as Assinatura),
    updateStatus: async (id: string, status: AssinaturaStatus) => true,
    renovar: async (id: string, proximoVencimento: Date) => true,
    setInicioCarencia: async (id: string, data: Date) => true,
    findInGracePeriod: async () => [] as Assinatura[]
};

export const cobrancaRepository = {
    jaProcessada: async (refId: string) => false,
    registrar: async (data: any) => true
};

export const notificacaoService = {
    enviarBoasVindas: async (id: string) => { },
    enviarAcessoRestaurado: async (id: string) => { },
    enviarFalhaCobranca: async (id: string, data: any) => { },
    enviarAcessoSuspenso: async (id: string) => { },
    enviarLembretePagamento: async (id: string, data: any) => { }
};

export const liberarAcesso = async (contratanteId: string) => { };
export const suspenderAcesso = async (contratanteId: string) => { };

export function proximoMesNoDia(diaVencimento: number): Date {
    const data = new Date();
    data.setMonth(data.getMonth() + 1);
    data.setDate(Math.min(diaVencimento, 28)); // Previne avanço incorreto p/ Fev
    return data;
}

export function daysSince(date: Date | undefined): number {
    if (!date) return 0;
    const diff = new Date().getTime() - date.getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
}
