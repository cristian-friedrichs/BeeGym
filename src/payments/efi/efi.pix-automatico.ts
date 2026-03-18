import { efiClient } from './efi.client';
import { efiConfig } from './efi.config';
import fs from 'fs';
import {
    CriarAcordoPixInput,
    AcordoPixAutomatico
} from './efi.types';

export class EfiPixAutomaticoService {
    /**
     * O endpoint de Pix Automático (Acordos)
     * Documentação: https://dev.efipay.com.br/docs/api-pix/pix-automatico
     */
    private getBaseUrl() {
        return efiConfig.baseUrlPix;
    }

    /**
     * Cria o Acordo de Pix Automático (Jornada 2 completa).
     *
     * Fluxo EFI Jornada 2:
     * 1. POST /v2/locrec          → Cria location
     * 2. POST /v2/rec             → Cria recorrência vinculada ao location
     * 3. PUT  /v2/cobr/:txid      → Cria cobrança com vencimento (gera QR Code)
     * 4. GET  /v2/locrec/:id/qrcode → Busca BRCode real
     */
    public async criarAcordo(dados: CriarAcordoPixInput): Promise<AcordoPixAutomatico> {
        const baseUrl = this.getBaseUrl();
        const valorCobranca = dados.valorPromo || dados.valor.fixo;

        // O Pix Automático (locrec / rec puro) só será oficialmente suportado por todos os bancos em meados de 2025 (Jornada 2).
        // Por causa disso, os aplicativos dos bancos recusam QR Codes "locrec" (Copia e Cola puros de consentimento).
        // Para resolver o onboarding agora, geraremos um Pix Imediato normal (v2/cob) com o valor da 1ª mensalidade.
        // O Webhook do sistema já processa PIX Imediato corretamente e ativa a assinatura.
        
        // BCB exige TXID entre 26 e 35 caracteres para Pix Imediato
        let txid = `BGYM${Date.now()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`.padEnd(26, 'X').substring(0, 35);

        const docLimpo = dados.devedor.cpf.replace(/\D/g, '');
        const devedorConfig = docLimpo.length === 14 
            ? { cnpj: docLimpo, nome: dados.devedor.nome.substring(0, 200) }
            : { cpf: docLimpo, nome: dados.devedor.nome.substring(0, 200) };

        const cobPayload = {
            calendario: { expiracao: 3600 },
            devedor: devedorConfig,
            valor: {
                original: Number(valorCobranca).toFixed(2)
            },
            chave: dados.chave,
            solicitacaoPagador: (dados.descricao || 'Assinatura BeeGym').substring(0, 140),
            infoAdicionais: [
                { nome: 'Assinatura', valor: 'Mensal' }
            ]
        };

        try {
            const cobResponse = await efiClient.put(`${baseUrl}/v2/cob/${txid}`, cobPayload);
            const brCode = cobResponse.data.pixCopiaECola;

            if (!brCode) {
                throw new Error("Resposta da EFI não contém pixCopiaECola.");
            }

            const logSuccess = `\n--- [${new Date().toISOString()}] EFI V2 COB (Fallback Pix Automático) SUCCESS ---\nTxid: ${txid}\n`;
            try { fs.appendFileSync('debug_onboarding.log', logSuccess); } catch (e) { }

            return {
                acordoId: txid,
                status: 'CRIADO',
                urlConsentimento: '',
                pixCopiaECola: brCode,
                expiracao: new Date(Date.now() + 3600 * 1000).toISOString()
            };

        } catch (err: any) {
            console.error('[EFI Pix] Erro crítico ao criar cobrança imediata PIX:', err.response?.data || err.message);
            const logErr = `[EFI Pix] ERRO CRÍTICO COB: ${JSON.stringify(err.response?.data || err.message)}\n`;
            try { fs.appendFileSync('debug_onboarding.log', logErr); } catch (e) { }
            throw err;
        }
    }

    /**
     * Consulta detalhes de uma Recorrência
     * /
    public async consultarAcordo(acordoId: string): Promise<AcordoPixAutomatico> {
        const baseUrl = this.getBaseUrl();
        const response = await efiClient.get(`${baseUrl}/v2/rec/${acordoId}`);

        return {
            acordoId: response.data.idRec || response.data.idRecorrencia,
            status: response.data.status || response.data.situacao,
            urlConsentimento: response.data.urlConsentimento,
            expiracao: response.data.expiracao
        };
    }

    /**
     * Cancela a Recorrência
     */
    public async cancelarAcordo(acordoId: string): Promise<void> {
        const baseUrl = this.getBaseUrl();
        // Documentação diz status: 'CANCELADA'
        await efiClient.patch(`${baseUrl}/v2/rec/${acordoId}`, {
            status: 'CANCELADA'
        });
    }

    /**
     * Altera o valor recorrente do Acordo (Pix Automático)
     */
    public async alterarValorAcordo(acordoId: string, novoValorFixo: number): Promise<void> {
        const baseUrl = this.getBaseUrl();
        await efiClient.patch(`${baseUrl}/v2/rec/${acordoId}`, {
            valor: {
                valorRec: Number(novoValorFixo).toFixed(2)
            }
        });
    }

    /**
     * Webhook V2
     */
    public async registrarWebhook(chave: string, webhookUrl: string): Promise<void> {
        const baseUrl = this.getBaseUrl();
        await efiClient.put(`${baseUrl}/v2/webhook/${chave}`, {
            webhookUrl
        });
    }
}

export const efiPixAutomatico = new EfiPixAutomaticoService();
