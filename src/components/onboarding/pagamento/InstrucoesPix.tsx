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
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 font-display">Dados do Pagador (Billing)</h4>
                    <span className="text-[10px] bg-bee-amber/10 text-amber-700 px-2.5 py-1 rounded-lg font-black font-display tracking-wider">PIX</span>
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
                            className="h-12 text-sm rounded-2xl border-slate-100 focus:border-bee-amber focus:ring-bee-amber/20"
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
                            className="h-12 text-sm rounded-2xl border-slate-100 focus:border-bee-amber focus:ring-bee-amber/20"
                        />
                    </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-50 pt-2">
                    <strong>Nota:</strong> Você pode usar dados diferentes da sua empresa caso queira pagar como pessoa física ou através de outra conta.
                </p>
            </div>

            {/* Como funciona */}
            <div className="bg-amber-50/30 border border-amber-100/50 rounded-3xl p-6 space-y-5">
                <h4 className="font-black text-sm text-bee-midnight font-display tracking-tightSmall">Como funciona o Pix Automático</h4>
                <ol className="space-y-3">
                    {etapas.map((e, i) => (
                        <li key={i} className="flex items-start gap-3.5 text-sm text-slate-500 font-medium leading-snug">
                            <span className="w-5 h-5 rounded-full bg-bee-amber text-bee-midnight text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5 font-display">
                                {i + 1}
                            </span>
                            {e}
                        </li>
                    ))}
                </ol>
                <div className="flex items-start gap-3 pt-4 border-t border-amber-100/50 text-[11px] text-amber-700 font-medium">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-bee-amber" />
                    <p>
                        O débito ocorre todo dia <strong>{diaVencimento}</strong> do mês. Cancele quando quiser, sem multa.
                    </p>
                </div>
            </div>
        </div>
    );
}
