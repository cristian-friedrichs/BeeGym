import { efiClient } from './efi.client';
import qrcode from 'qrcode';
import {
    CriarPixInput,
    PixCobranca,
    ListarPixFiltros,
    ListarPixResponse
} from './efi.types';

export class EfiPixService {
    /**
     * Criar uma cobrança Pix Imediata
     * O TXID é gerado automaticamente pela EFI.
     */
    public async criarCobrancaPix(dados: CriarPixInput): Promise<PixCobranca> {
        const response = await efiClient.post('/v2/cob', dados);
        return response.data as PixCobranca;
    }

    /**
     * Criar cobrança Pix com um TXID definido pelo sistema (Idempotente)
     */
    public async criarCobrancaPixComTxid(txid: string, dados: CriarPixInput): Promise<PixCobranca> {
        // Validação básica do formato do txid: [a-zA-Z0-9]{26,35}
        if (!/^[a-zA-Z0-9]{26,35}$/.test(txid)) {
            throw new Error(`TXID inválido para criação PIX: ${txid}`);
        }

        const response = await efiClient.put(`/v2/cob/${txid}`, dados);
        return response.data as PixCobranca;
    }

    /**
     * Consulta uma cobrança via txid
     */
    public async consultarCobranca(txid: string): Promise<PixCobranca> {
        const response = await efiClient.get(`/v2/cob/${txid}`);
        return response.data as PixCobranca;
    }

    /**
     * Gera um QR Code em formato Base64 a partir de uma "Copia e Cola" (BRCode)
     */
    public async gerarQrCode(pixCopiaECola: string): Promise<string> {
        try {
            const base64Image = await qrcode.toDataURL(pixCopiaECola, {
                errorCorrectionLevel: 'M',
                margin: 2,
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            return base64Image;
        } catch (err: any) {
            throw new Error(`Falha ao gerar QR Code para string: ${err?.message}`);
        }
    }

    /**
     * Cancelar uma cobrança que está aberta.
     * Modifica a cobrança substituindo pela revisão e com valor nulo, 
     * ou pelo status de remoção direto na rota oficial.
     */
    public async cancelarCobranca(txid: string): Promise<PixCobranca> {
        const currentState = await this.consultarCobranca(txid);

        // Atualiza a cobrança para status removida. Pela api da EFI, usamos PATCH
        const response = await efiClient.patch(`/v2/cob/${txid}`, {
            status: 'REMOVIDA_PELO_USUARIO_RECEBEDOR'
        });

        return response.data as PixCobranca;
    }

    /**
     * Listar múltiplas cobranças aplicando um filtro de tempo.
     * Datas devem estar no formato UTC ISO (Ex: 2021-01-01T00:00:00Z)
     */
    public async listarCobrancas(filtros: ListarPixFiltros): Promise<ListarPixResponse> {
        const params = new URLSearchParams();
        params.append('inicio', filtros.inicio);
        params.append('fim', filtros.fim);

        if (filtros.status) {
            params.append('status', filtros.status);
        }

        const response = await efiClient.get(`/v2/cob?${params.toString()}`);
        return response.data as ListarPixResponse;
    }
}

// Singleton export
export const efiPix = new EfiPixService();
