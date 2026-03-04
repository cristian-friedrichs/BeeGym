'use client';

import { useEffect, useState } from 'react';
import { Info, User, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
    initialName?: string;
    initialDoc?: string;
    onChange?: (data: { devedorNome: string, devedorCpf: string }) => void;
}

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

export function InstrucoesPix({ initialName = '', initialDoc = '', onChange }: Props) {
    const diaVencimento = Math.min(new Date().getDate(), 28);

    const [name, setName] = useState(initialName);
    const [doc, setDoc] = useState(initialDoc ? formatDoc(initialDoc) : '');

    // Sincroniza inicialização
    useEffect(() => {
        if (initialName && !name) setName(initialName);
        if (initialDoc && !doc) setDoc(formatDoc(initialDoc));
    }, [initialName, initialDoc]);

    // Notifica o pai sobre mudanças
    useEffect(() => {
        onChange?.({
            devedorNome: name,
            devedorCpf: doc.replace(/\D/g, '')
        });
    }, [name, doc, onChange]);

    const etapas = [
        'Clique em "Assinar" abaixo',
        'Você será redirecionado para o seu banco',
        'Autorize o débito automático mensal',
        'Pronto — acesso liberado imediatamente',
    ];

    return (
        <div className="space-y-4">
            {/* Dados do Pagador (Editáveis) */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dados do Pagador (Billing)</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">PIX</span>
                </div>

                <div className="space-y-3">
                    <div>
                        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                            <User className="w-3 h-3 text-slate-400" /> Nome Completo no Banco
                        </Label>
                        <Input
                            placeholder="Nome do titular da conta"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="h-10 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                            <FileText className="w-3 h-3 text-slate-400" /> CPF ou CNPJ da Conta
                        </Label>
                        <Input
                            placeholder="000.000.000-00"
                            value={doc}
                            onChange={e => setDoc(formatDoc(e.target.value))}
                            maxLength={18}
                            className="h-10 text-sm"
                        />
                    </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-50 pt-2">
                    <strong>Nota:</strong> Você pode usar dados diferentes da sua empresa caso queira pagar como pessoa física ou através de outra conta.
                </p>
            </div>

            {/* Como funciona */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-sm text-[#00173F]">Como funciona o Pix Automático</h4>
                <ol className="space-y-2.5">
                    {etapas.map((e, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                            </span>
                            {e}
                        </li>
                    ))}
                </ol>
                <div className="flex items-start gap-2 pt-1 border-t border-blue-100 text-xs text-blue-600">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <p>
                        O débito ocorre todo dia <strong>{diaVencimento}</strong> do mês. Cancele quando quiser, sem multa.
                    </p>
                </div>
            </div>
        </div>
    );
}
