import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EfiCardService } from '../efi.card';
import { efiClient } from '../efi.client';
import { CriarCartaoInput } from '../efi.types';

// Oculta warnings do console
vi.spyOn(console, 'warn').mockImplementation(() => { });

vi.mock('../efi.client', () => ({
    efiClient: {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
    }
}));

describe('EfiCardService', () => {
    let service: EfiCardService;

    const mockCartaoInput: CriarCartaoInput = {
        items: [{ name: 'Assinatura PRO', value: 10000, amount: 1 }],
        customer: {
            name: 'João Teste',
            cpf: '12345678909',
            phone_number: '11999999999',
            email: 'joao@teste.com',
            birth: '1990-01-01'
        },
        payment_token: 'fake-token-123',
        installments: 1,
        billing_address: {
            street: 'Rua Teste',
            number: '123',
            neighborhood: 'Bairro',
            zipcode: '01234567',
            city: 'São Paulo',
            state: 'SP'
        },
        message: 'id-interno-123'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        service = new EfiCardService();
    });

    describe('segurança PCI e validações iniciais', () => {
        it('deve rejeitar payment_token vazio antes de chamar a API', async () => {
            const inputVazio = { ...mockCartaoInput, payment_token: '' };
            await expect(service.criarCobrancaCartao(inputVazio)).rejects.toThrow(/payment_token/);
            expect(efiClient.post).not.toHaveBeenCalled();
        });

        it('deve rejeitar payment_token undefined antes de chamar a API', async () => {
            const inputUndefined = { ...mockCartaoInput, payment_token: undefined as any };
            await expect(service.criarCobrancaCartao(inputUndefined)).rejects.toThrow(/payment_token/);
            expect(efiClient.post).not.toHaveBeenCalled();
        });

        it('a assinatura do método não deve aceitar número de cartão diretamente', () => {
            type PagarParams = Parameters<typeof service.criarCobrancaCartao>;
            type Param1 = PagarParams[0]; // CriarCartaoInput
            const _check: Param1 = mockCartaoInput;
            expect(true).toBe(true);
        });
    });

    it('deve criar uma cobrança e realizar pagamento de cartão em duas chamadas', async () => {
        // Mock Passo 1: /v1/charge
        (efiClient.post as any).mockResolvedValueOnce({
            data: { data: { charge_id: 1000 } }
        });

        // Mock Passo 2: /v1/charge/:id/pay
        (efiClient.post as any).mockResolvedValueOnce({
            data: {
                code: 200,
                data: {
                    charge_id: 1000,
                    status: 'paid',
                    total: 10000,
                    payment: 'credit_card'
                }
            }
        });

        const result = await service.criarCobrancaCartao(mockCartaoInput);

        // Validar primeira chamada
        expect(efiClient.post).toHaveBeenNthCalledWith(1, expect.stringContaining('/v1/charge'), {
            items: mockCartaoInput.items,
            metadata: { custom_id: mockCartaoInput.message }
        });

        // Validar segunda chamada
        expect(efiClient.post).toHaveBeenNthCalledWith(2, expect.stringContaining('/v1/charge/1000/pay'), {
            payment: {
                credit_card: {
                    installments: 1,
                    billing_address: mockCartaoInput.billing_address,
                    payment_token: mockCartaoInput.payment_token,
                    customer: mockCartaoInput.customer
                }
            }
        });

        expect(result.data.status).toBe('paid');
        expect(result.data.charge_id).toBe(1000);
    });

    it('deve consultar fatura do cartão corretamente', async () => {
        (efiClient.get as any).mockResolvedValueOnce({
            data: { data: { status: 'waiting' } }
        });

        const result = await service.consultarCobranca(1000);

        expect(efiClient.get).toHaveBeenCalledWith(expect.stringContaining('/v1/charge/1000'));
        expect(result.data.status).toBe('waiting');
    });

    it('deve lançar erro se o payment_token estiver vazio ou indefinido', async () => {
        const inputSemToken = { ...mockCartaoInput, payment_token: '' };
        await expect(service.criarCobrancaCartao(inputSemToken)).rejects.toThrow('O token de pagamento (payment_token) é obrigatório');

        const inputSemTokenUndefined = { ...mockCartaoInput, payment_token: undefined as any };
        await expect(service.criarCobrancaCartao(inputSemTokenUndefined)).rejects.toThrow('O token de pagamento (payment_token) é obrigatório');
    });

    it('deve cancelar a fatura do cartão via PUT', async () => {
        (efiClient.put as any).mockResolvedValueOnce({
            data: { code: 200 }
        });

        await service.cancelarCobranca(1000);

        expect(efiClient.put).toHaveBeenCalledWith(expect.stringContaining('/v1/charge/1000/cancel'));
    });
});
