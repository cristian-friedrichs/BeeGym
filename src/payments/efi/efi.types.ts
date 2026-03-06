/**
 * Tipagens para o Gateway EFI
 */

export type EfiEnv = 'homologacao' | 'producao';

export interface EfiConfig {
    ambiente: EfiEnv;
    clientId: string;
    clientSecret: string;
    certPath: string;
    certBase64?: string;
    certPassword?: string;
    webhookSecret: string;
    baseUrlPix: string;
    baseUrlCobrancas: string;
    baseUrlOauth: string;

    // Recorrência V2
    chavePixAutomatico?: string;
    webhookPixAutomaticoSecret?: string;
    webhookCardRecorrenteSecret?: string;
    planosCartao?: {
        STARTER: number;
        PRO: number;
        ENTERPRISE: number;
    };
}

// ------------------------
// PIX
// ------------------------

export interface CriarPixInput {
    calendario: {
        expiracao: number; // Em segundos
    };
    devedor: {
        cpf?: string;
        cnpj?: string;
        nome: string;
    };
    valor: {
        original: string; // Ex: "10.00"
    };
    chave: string; // Chave Pix cadastrada na EFI
    solicitacaoPagador?: string;
}

export type PixStatus = 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';

export interface PixCobranca {
    txid: string;
    calendario: {
        criacao: string;
        expiracao: number;
    };
    status: PixStatus;
    valor: {
        original: string;
    };
    chave: string;
    solicitacaoPagador?: string;
    pixCopiaECola: string;
    revisao: number;
    infoAdicionais?: Array<{
        nome: string;
        valor: string;
    }>;
}

export interface ListarPixFiltros {
    inicio: string; // Data inicial, ISO 8601 ex: 2021-01-01T00:00:00Z
    fim: string;    // Data final, ISO 8601 ex: 2021-01-31T23:59:59Z
    status?: PixStatus;
}

export interface ListarPixResponse {
    parametros: {
        inicio: string;
        fim: string;
        paginacao: {
            paginaAtual: number;
            itensPorPagina: number;
            quantidadeDePaginas: number;
            quantidadeTotalDeItens: number;
        };
    };
    cobs: PixCobranca[];
}

// ------------------------
// WEBHOOKS
// ------------------------

export interface WebhookPixPayload {
    pix: Array<{
        endToEndId: string;
        txid: string;
        chave: string;
        valor: string;
        horario: string;
        infoPagador?: string;
        devolucoes?: Array<any>;
    }>;
}

export interface WebhookCobrancaPayload {
    // A definir com base na documentação exata de cobranças da EFI
    data: Array<{
        identificador: string;
        notification?: string;
    }>;
}

// ------------------------
// CARTÃO DE CRÉDITO
// ------------------------

export interface CriarCartaoInput {
    items: Array<{
        name: string;
        value: number; // Em centavos. Ex: R$ 10,00 -> 1000
        amount: number;
    }>;
    customer: {
        name: string;
        cpf: string;
        phone_number: string;
        email: string;
        birth: string; // YYYY-MM-DD
    };
    payment_token: string; // Token gerado no frontend com a lib da EFI
    installments: number; // Quantidade de parcelas
    billing_address: {
        street: string;
        number: string;
        neighborhood: string;
        zipcode: string;
        city: string;
        state: string;
    };
    message?: string;
}

export type CartaoStatus = 'new' | 'waiting' | 'paid' | 'unpaid' | 'canceled' | 'settled' | 'contested' | 'refunded';

export interface CartaoCobranca {
    code: number;
    data: {
        installments: number;
        installment_value: number;
        charge_id: number;
        status: CartaoStatus;
        total: number;
        custom_id?: string;
        created_at: string;
        payment: string; // Ex: 'credit_card'
    };
}

// ------------------------
// INJEÇÃO DE DEPENDÊNCIA
// ------------------------

// ── Status de Assinatura (interno BeeGym) ──────────────────────
export type AssinaturaStatus =
    | 'PENDENTE'      // Criou conta, não concluiu pagamento
    | 'TRIAL'         // Concluiu cadastro/pagamento, dentro dos 7 dias
    | 'ATIVO'         // Concluiu cadastro/pagamento, após 7 dias de trial
    | 'INADIMPLENTE'  // Estava ativo mas deixou de pagar
    | 'INATIVO';      // Cancelado após inadimplência/solicitação

export type MetodoPagamento = 'PIX_AUTOMATICO' | 'CARTAO_RECORRENTE';

// ── Pix Automático ─────────────────────────────────────────────
export type PixAutomaticoAcordoStatus =
    | 'CRIADO'
    | 'PENDENTE_CONSENTIMENTO'
    | 'ATIVO'
    | 'CANCELADO_PELO_PAGADOR'
    | 'CANCELADO_PELO_RECEBEDOR'
    | 'EXPIRADO';

export interface CriarAcordoPixInput {
    devedor: { cpf: string; nome: string };
    valor: { fixo: string };            // ex: "150.00" (valor cheio da recorrência)
    valorPromo?: string;                // ex: "49.90" (valor do primeiro boleto se houver promoção)
    descricao: string;                  // ex: "Assinatura BeeGym — Plano Pro"
    chave: string;                      // chave Pix recebedora do BeeGym
    recorrencia: {
        tipo: 'MENSAL';
        diaVencimento: number;            // 1-28 — mesmo dia do primeiro pagamento
    };
    urlRetorno: string;
}

export interface AcordoPixAutomatico {
    acordoId: string;
    status: PixAutomaticoAcordoStatus;
    urlConsentimento: string;
    pixCopiaECola?: string;
    expiracao: string;
}

export interface WebhookPixAutomaticoConsentimento {
    acordoId: string;
    status: 'ATIVO' | 'CANCELADO_PELO_PAGADOR' | 'EXPIRADO';
    devedor: { cpf: string; nome: string };
    dataConsentimento?: string;
}

export interface WebhookPixAutomaticoCobranca {
    txid: string;
    acordoId: string;
    status: 'CONCLUIDA' | 'FALHA' | 'CANCELADA';
    valor: string;
    dataDebito: string;
}

// ── Cartão Recorrente (tokenização EFI nativa) ──────────────────
export interface CriarAssinaturaCartaoInput {
    items: Array<{ name: string; value: number; amount: number }>;
    customer: {
        name: string;
        cpf: string;
        email: string;
        phone_number: string;
        birth: string;          // YYYY-MM-DD
    };
    payment: {
        payment_token: string;  // gerado pelo JS SDK EFI no frontend
        billing_address: {
            street: string;
            number: string;
            neighborhood: string;
            zipcode: string;
            city: string;
            state: string;       // UF — ex: "SP"
        };
    };
    discount?: {
        type: 'currency' | 'percentage';
        value: number;
    };
    // Configuração da recorrência
    repeats: number | null;  // null = repetir indefinidamente
    interval: 1;             // 1 = mensal (padrão EFI)
}

export interface AssinaturaCartao {
    subscription_id: number; // ID da assinatura recorrente na EFI
    status: 'active' | 'inactive' | 'canceled';
    plan: { id: number; interval: number; repeats: number | null };
    charge_id: number;       // primeiro charge gerado
}

export interface WebhookCartaoRecorrentePayload {
    event: string;
    data: {
        subscription_id: number;
        charge_id: number;
        status: 'paid' | 'canceled' | 'failed' | 'unpaid';
        custom_id?: string;
    };
}

export interface IPaymentConfirmationUseCase {
    execute(txidOrChargeId: string, status: string, method: 'PIX' | 'CARTAO'): Promise<void>;
}
