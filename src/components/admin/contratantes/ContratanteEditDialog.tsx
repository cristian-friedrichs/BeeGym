'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Edit2, LayoutDashboard } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#0B0F1A]">
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md border-l shadow-2xl p-0 flex flex-col h-full">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <LayoutDashboard className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                Editar Cliente
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Altere as informações básicas deste contratante.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Organização / Responsável</Label>
                            <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={loading} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone</Label>
                                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={loading} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">CPF / CNPJ</Label>
                                <Input value={documento} onChange={(e) => setDocumento(e.target.value)} disabled={loading} className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço Completo</Label>
                            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} disabled={loading} placeholder="Rua, Número, Cidade, Estado" className="h-11 rounded-2xl border-slate-200 focus-visible:ring-bee-amber/20 focus-visible:border-bee-amber shadow-sm px-5" />
                        </div>
                    </div>
                </ScrollArea>

                <SheetFooter className="p-8 border-t bg-slate-50/50 gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                        className="flex-1 h-10 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={handleSave}
                        className="flex-[1.5] h-10 rounded-full bg-bee-amber text-bee-midnight hover:bg-bee-amber/90 font-black shadow-lg shadow-bee-amber/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px]"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
