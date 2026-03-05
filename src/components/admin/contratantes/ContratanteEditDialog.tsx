'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Edit2 } from 'lucide-react';

interface Props {
    contratante: any; // { id, nome, telefone, cpf_cnpj, endereco }
    onUpdated: () => void;
}

export function ContratanteEditDialog({ contratante, onUpdated }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Local state for the form
    const [nome, setNome] = useState(contratante.nome);
    const [telefone, setTelefone] = useState(contratante.telefone);
    const [documento, setDocumento] = useState(contratante.cpf_cnpj);
    const [endereco, setEndereco] = useState(contratante.endereco); // We treat it as a single string for simplicity here, though in DB it's split. We can send it to the backend as a single string or adjust.
    // The backend updateBasicInfo receives { name, phone, address, document }

    const handleSave = async () => {
        if (!nome) {
            toast({ title: 'O nome é obrigatório.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/contratantes/${contratante.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nome, phone: telefone, address: endereco, document: documento })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

            toast({ title: 'Dados atualizados com sucesso.' });
            setOpen(false);
            onUpdated();
        } catch (err: any) {
            toast({ title: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#0B0F1A]">
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-none rounded-[2rem] shadow-2xl overflow-hidden p-0">
                <DialogHeader className="px-8 pt-8 pb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex items-center gap-3 mb-2 relative">
                        <div className="w-1.5 h-6 bg-bee-amber rounded-full" />
                        <DialogTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight">
                            Editar Cliente
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm font-medium text-slate-400 relative">
                        Altere as informações básicas deste contratante.
                    </DialogDescription>
                </DialogHeader>
                <div className="px-8 py-4 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Organização / Responsável</Label>
                        <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={loading} className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</Label>
                            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={loading} className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">CPF / CNPJ</Label>
                            <Input value={documento} onChange={(e) => setDocumento(e.target.value)} disabled={loading} className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço Completo</Label>
                        <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} disabled={loading} placeholder="Rua, Número, Cidade, Estado" className="h-12 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm" />
                    </div>
                </div>
                <DialogFooter className="px-8 py-6 border-t bg-slate-50/50 gap-3">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading} className="text-slate-400 font-bold hover:bg-slate-100 rounded-xl">Cancelar</Button>
                    <Button
                        disabled={loading}
                        onClick={handleSave}
                        className="h-12 px-8 bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-bee-amber/20 transition-all border-none"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
