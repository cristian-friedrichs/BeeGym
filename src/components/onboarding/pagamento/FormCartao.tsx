'use client';

// Shim process for console debugging and libraries that expect it
if (typeof window !== 'undefined') {
    if (!window.process) {
        (window as any).process = { env: {} };
    }
    // Fallback for missing env vars in some browser environments
    (window as any).process.env = {
        ...((window as any).process.env || {}),
        NEXT_PUBLIC_EFI_PAYEE_CODE: (window as any).process.env?.NEXT_PUBLIC_EFI_PAYEE_CODE || '',
        NEXT_PUBLIC_EFI_AMBIENTE: (window as any).process.env?.NEXT_PUBLIC_EFI_AMBIENTE || 'homologacao'
    };
}

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export interface DadosCartao {
    paymentToken: string;
    billingAddress: {
        street: string;
        number: string;
        neighborhood: string;
        zipcode: string;
        city: string;
        state: string;
    };
    customerData: {
        name: string;
        cpf: string;
        email: string;
        phone_number: string;
        birth: string;
    };
}

export interface FormCartaoRef {
    tokenize: () => Promise<DadosCartao>;
}

interface Props {
    email?: string;
    initialName?: string;
    initialDoc?: string;
    onRef?: (ref: FormCartaoRef) => void;
}

const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
const formatExpiry = (v: string) =>
    v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');

// Suporta CPF (11) ou CNPJ (14)
const formatDoc = (v: string) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length <= 11) {
        return clean.slice(0, 11)
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return clean.slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const formatPhone = (v: string) =>
    v.replace(/\D/g, '').slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
const formatCep = (v: string) =>
    v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

declare global {
    interface Window {
        EfiPay?: { CreditCard: any };
    }
}

export function FormCartao({ email = '', initialName = '', initialDoc = '', onRef }: Props) {
    const [isCepLoading, setIsCepLoading] = useState(false);

    const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [billing, setBilling] = useState({ street: '', number: '', neighborhood: '', zipcode: '', city: '', state: '' });
    const [customer, setCustomer] = useState({
        name: initialName,
        cpf: initialDoc ? formatDoc(initialDoc) : '',
        phone_number: '',
        birth: ''
    });

    // Sincroniza dados iniciais quando carregarem
    useEffect(() => {
        if (initialName && !customer.name) {
            setCustomer(prev => ({ ...prev, name: initialName }));
        }
        if (initialDoc && !customer.cpf) {
            setCustomer(prev => ({ ...prev, cpf: formatDoc(initialDoc) }));
        }
    }, [initialName, initialDoc]);

    // Expose tokenize function to parent
    useEffect(() => {
        if (!onRef) return;
        onRef({
            tokenize: async () => {
                const EfiPayModule = await import('payment-token-efi');
                const EfiPay = EfiPayModule.default || EfiPayModule;

                const payeeCode = process.env.NEXT_PUBLIC_EFI_PAYEE_CODE || '';
                const environment = process.env.NEXT_PUBLIC_EFI_AMBIENTE === 'producao'
                    ? 'production'
                    : 'sandbox';

                console.warn('🚀 [FormCartao] INICIANDO TOKENIZAÇÃO COM SDK EFI');

                if (!payeeCode) {
                    throw new Error('Configuração de pagamento incompleta. PAYEE_CODE não configurado.');
                }

                const bloqueado = await EfiPay.CreditCard.isScriptBlocked();
                if (bloqueado) {
                    throw new Error('Seu navegador está bloqueando o processamento seguro do cartão (AdBlock?).');
                }

                // Configuração base mandatória
                EfiPay.CreditCard.setAccount(payeeCode).setEnvironment(environment);

                const numeroLimpo = card.number.replace(/\D/g, '');
                // Verificar bandeira
                const bandeira = await EfiPay.CreditCard
                    .setCardNumber(numeroLimpo)
                    .verifyCardBrand();

                if (!bandeira || bandeira === 'undefined' || bandeira === 'unsupported') {
                    throw new Error(`Bandeira não reconhecida (${bandeira}). O número do cartão pode estar incorreto para o ambiente de ${environment}. Lembre-se de usar números de teste para sandbox.`);
                }

                const [month, year] = card.expiry.split('/');

                try {
                    const docLimpo = customer.cpf.replace(/\D/g, '');
                    const resultado = await EfiPay.CreditCard
                        .setCreditCardData({
                            brand: bandeira,
                            number: numeroLimpo,
                            cvv: card.cvv,
                            expirationMonth: month,
                            expirationYear: `20${year}`,
                            holderName: customer.name,
                            holderDocument: docLimpo,
                            reuse: true,
                        })
                        .getPaymentToken();

                    console.warn('✅ [FormCartao] TOKEN GERADO:', (resultado as any).payment_token?.slice(0, 15) + '...');

                    return {
                        paymentToken: (resultado as any).payment_token,
                        billingAddress: {
                            ...billing,
                            zipcode: billing.zipcode.replace(/\D/g, ''),
                        },
                        customerData: {
                            name: customer.name,
                            cpf: docLimpo,
                            email,
                            phone_number: customer.phone_number.replace(/\D/g, ''),
                            birth: customer.birth,
                        },
                    };
                } catch (sdkError: any) {
                    console.error('❌ [FormCartao] ERRO NO SDK EFI:', sdkError);

                    // Tratamento de erro específico da EFI
                    const errorMsg = sdkError?.error_description ||
                        sdkError?.message ||
                        (typeof sdkError === 'string' ? sdkError : 'Número do cartão inválido ou recusado pela operadora.');

                    throw new Error(errorMsg);
                }
            },
        });
    }, [card, billing, customer, email, onRef]);

    const handleCepBlur = async () => {
        const cep = billing.zipcode.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsCepLoading(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setBilling(prev => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: data.uf || prev.state,
                }));
            }
        } finally {
            setIsCepLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Dados do cartão */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dados do Cartão</h4>
                <div className="space-y-3">
                    <div>
                        <Label className="text-xs">Número do Cartão</Label>
                        <Input
                            placeholder="0000 0000 0000 0000"
                            value={card.number}
                            onChange={e => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                            maxLength={19}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Nome no Cartão</Label>
                        <Input
                            placeholder="Como impresso no cartão"
                            value={card.name}
                            onChange={e => setCard(p => ({ ...p, name: e.target.value.toUpperCase() }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Validade</Label>
                            <Input
                                placeholder="MM/AA"
                                value={card.expiry}
                                onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                                maxLength={5}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">CVV</Label>
                            <Input
                                placeholder="• • •"
                                type="password"
                                value={card.cvv}
                                onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                maxLength={4}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Titular */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dados do Titular</h4>
                <div className="space-y-3">
                    <div>
                        <Label className="text-xs">Nome Completo</Label>
                        <Input
                            placeholder="Seu nome completo"
                            value={customer.name}
                            onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">CPF ou CNPJ</Label>
                            <Input
                                placeholder="000.000.000-00"
                                value={customer.cpf}
                                onChange={e => setCustomer(p => ({ ...p, cpf: formatDoc(e.target.value) }))}
                                maxLength={18}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Telefone</Label>
                            <Input
                                placeholder="(11) 99999-0000"
                                value={customer.phone_number}
                                onChange={e => setCustomer(p => ({ ...p, phone_number: formatPhone(e.target.value) }))}
                                maxLength={15}
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs">Data de Nascimento</Label>
                        <Input
                            type="date"
                            value={customer.birth}
                            onChange={e => setCustomer(p => ({ ...p, birth: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Endereço de Cobrança */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Endereço de Cobrança</h4>
                <div className="space-y-3">
                    <div>
                        <Label className="text-xs">CEP</Label>
                        <div className="relative">
                            <Input
                                placeholder="00000-000"
                                value={billing.zipcode}
                                onChange={e => setBilling(p => ({ ...p, zipcode: formatCep(e.target.value) }))}
                                onBlur={handleCepBlur}
                                maxLength={9}
                            />
                            {isCepLoading && (
                                <div className="absolute right-3 top-2.5">
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                </div>
                            )}
                        </div>
                    </div>
                    {/* ... (rest of the fields) */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <Label className="text-xs">Rua / Avenida</Label>
                            <Input
                                placeholder="Rua Exemplo"
                                value={billing.street}
                                onChange={e => setBilling(p => ({ ...p, street: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Número</Label>
                            <Input
                                placeholder="123"
                                value={billing.number}
                                onChange={e => setBilling(p => ({ ...p, number: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Bairro</Label>
                            <Input
                                placeholder="Bairro"
                                value={billing.neighborhood}
                                onChange={e => setBilling(p => ({ ...p, neighborhood: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Cidade</Label>
                            <Input
                                placeholder="Cidade"
                                value={billing.city}
                                onChange={e => setBilling(p => ({ ...p, city: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="w-24">
                        <Label className="text-xs">Estado (UF)</Label>
                        <Input
                            placeholder="SP"
                            value={billing.state}
                            onChange={e => setBilling(p => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
                            maxLength={2}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
