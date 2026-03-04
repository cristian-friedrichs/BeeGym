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
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#00173F]">
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>
                        Altere as informações básicas deste contratante.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome da Organização / Responsável</Label>
                        <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={loading} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label>CPF / CNPJ</Label>
                            <Input value={documento} onChange={(e) => setDocumento(e.target.value)} disabled={loading} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Endereço Completo</Label>
                        <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} disabled={loading} placeholder="Rua, Número, Cidade, Estado" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
                    <Button className="bg-[#00173F] hover:bg-[#00173f]/90" onClick={handleSave} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
