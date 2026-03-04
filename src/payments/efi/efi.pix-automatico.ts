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

        // --- PASSO 1: Criar Location para a Recorrência ---
        const locResponse = await efiClient.post(`${baseUrl}/v2/locrec`, {});
        const locId = locResponse.data.id;
        const locationUrl = locResponse.data.location;
        // --- PASSO 2: Criar a Recorrência vinculada ao Location ---
        const diaVenc = dados.recorrencia?.diaVencimento || 10;
        const dataInicial = (() => {
            const today = new Date();
            let vMonth = today.getMonth();
            let vYear = today.getFullYear();
            if (today.getDate() >= diaVenc) {
                vMonth++;
                if (vMonth > 11) { vMonth = 0; vYear++; }
            }
            const nextDate = new Date(vYear, vMonth, diaVenc);
            const localIso = new Date(nextDate.getTime() - nextDate.getTimezoneOffset() * 60000).toISOString();
            return localIso.split('T')[0];
        })();

        const recPayload = {
            loc: locId,
            vinculo: {
                contrato: `BGYM${Date.now().toString().slice(-8)}`,
                devedor: {
                    cpf: dados.devedor.cpf.replace(/\D/g, ''),
                    nome: dados.devedor.nome
                },
                objeto: 'AssinaturaBeeGym'
            },
            calendario: {
                dataInicial,
                periodicidade: 'MENSAL'
            },
            valor: {
                valorRec: Number(dados.valor.fixo).toFixed(2)
            },
            politicaRetentativa: 'NAO_PERMITE'
        };

        const recResponse = await efiClient.post(`${baseUrl}/v2/rec`, recPayload);

        const logSuccess = `\n--- [${new Date().toISOString()}] EFI V2 REC SUCCESS ---\nStatus: ${recResponse.status}\nBody: ${JSON.stringify(recResponse.data, null, 2)}\n`;
        try { fs.appendFileSync('debug_onboarding.log', logSuccess); } catch (e) { }

        const idRec = recResponse.data.idRec || recResponse.data.loc?.idRec;
        // --- PASSO 3: Criar Cobrança com Vencimento (cobr) vinculada ao loc ---
        const txid = `BGYM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`.substring(0, 35);

        const cobrPayload = {
            calendario: {
                dataDeVencimento: dataInicial,
                validadeAposVencimento: 30
            },
            devedor: {
                cpf: dados.devedor.cpf.replace(/\D/g, ''),
                nome: dados.devedor.nome
            },
            valor: {
                original: Number(valorCobranca).toFixed(2)
            },
            chave: dados.chave,
            solicitacaoPagador: dados.descricao || 'Assinatura BeeGym',
            loc: { id: locId }
        };

        let brCode: string | null = null;

        try {
            const cobrResponse = await efiClient.put(`${baseUrl}/v2/cobr/${txid}`, cobrPayload);
            brCode = cobrResponse.data.pixCopiaECola || cobrResponse.data.brcode || null;

            const logCobr = `[EFI Pix Auto] Cobrança OK: txid=${cobrResponse.data.txid}, brCode=${brCode ? 'OK' : 'NULL'}\n`;
            try { fs.appendFileSync('debug_onboarding.log', logCobr); } catch (e) { }
        } catch (err: any) {
            console.error('[EFI Pix Auto] Erro ao criar cobrança (cobr):', err.response?.data || err.message);
            const logErr = `[EFI Pix Auto] Erro cobr: ${JSON.stringify(err.response?.data || err.message)}\n`;
            try { fs.appendFileSync('debug_onboarding.log', logErr); } catch (e) { }
        }

        // --- PASSO 4: Buscar QR Code real ---
        if (!brCode && locId) {
            // Tentar via /v2/locrec/:id/qrcode (endpoint correto para Jornada 2)
            try {
                const qrResponse = await efiClient.get(`${baseUrl}/v2/locrec/${locId}/qrcode`);
                brCode = qrResponse.data.qrcode || qrResponse.data.pixCopiaECola || null;
            } catch (err: any) {
                console.error('[EFI Pix Auto] Erro locrec/qrcode:', err.response?.data || err.message);
            }
        }

        if (!brCode && locId) {
            // Fallback: /v2/loc/:id/qrcode
            try {
                const qrResponse = await efiClient.get(`${baseUrl}/v2/loc/${locId}/qrcode`);
                brCode = qrResponse.data.qrcode || qrResponse.data.pixCopiaECola || null;
            } catch (err: any) {
                console.error('[EFI Pix Auto] Fallback loc falhou:', err.response?.data || err.message);
            }
        }

        // Último fallback: usar a location URL como conteúdo do QR Code
        if (!brCode && locationUrl) {
            brCode = locationUrl;
            console.warn('[EFI Pix Auto] Usando location URL como fallback para QR Code');
        }

        const logFinal = `[EFI Pix Auto] RESULTADO FINAL: brCode=${brCode ? 'OK' : 'NULL'}, idRec=${idRec}\n`;
        try { fs.appendFileSync('debug_onboarding.log', logFinal); } catch (e) { }

        return {
            acordoId: idRec || recResponse.data.txid || null,
            status: recResponse.data.status || 'CRIADA',
            urlConsentimento: '',
            pixCopiaECola: brCode || undefined,
            expiracao: recResponse.data.expiracao || '2099-12-31T23:59:59Z'
        };
    }

    /**
     * Consulta detalhes de uma Recorrência
     */
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
