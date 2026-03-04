import { efiClient } from './efi.client';
import { efiConfig } from './efi.config';

export interface EfiPlanInput {
    name: string;
    repeats: number | null; // null = indefinitely
    interval: number; // in months
}

export class EfiPlansService {
    /**
     * Cria um novo plano de assinatura na EFI e retorna o ID do plano gerado
     * Endpoint: POST /v1/plan (API de Cobranças, NÃO a API Pix)
     */
    public async criarPlano(dados: EfiPlanInput): Promise<number> {
        const baseUrl = efiConfig.baseUrlCobrancas;

        let payload: any = {
            name: dados.name,
            interval: dados.interval
        };

        if (dados.repeats) {
            payload.repeats = dados.repeats;
        }

        try {
            const response = await efiClient.post(`${baseUrl}/v1/plan`, payload);

            if (response.data && response.data.data && response.data.data.plan_id) {
                return response.data.data.plan_id;
            }

            throw new Error('Retorno inesperado ao criar plano na EFI: ' + JSON.stringify(response.data));
        } catch (error: any) {
            console.error(`[EFI Plans] Falha ao criar plano ${dados.name}:`, error?.response?.data || error.message);
            throw error;
        }
    }
}

export const efiPlansService = new EfiPlansService();
