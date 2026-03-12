'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, UserCheck, Save } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type StudentStatusDialogProps = {
    studentId: string;
    studentName: string;
    currentStatus: 'ACTIVE' | 'INACTIVE' | 'OVERDUE';
    triggerButton?: React.ReactNode;
    onStatusChange?: (newStatus: 'ACTIVE' | 'INACTIVE', reason?: string) => void | Promise<void>;
};

export function StudentStatusDialog({
    studentId,
    studentName,
    currentStatus,
    triggerButton,
    onStatusChange,
}: StudentStatusDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const isActive = currentStatus === 'ACTIVE';
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';

    const handleConfirm = async () => {
        // Validar motivo ao inativar
        if (newStatus === 'INACTIVE' && !reason.trim()) {
            toast({
                title: 'Motivo obrigatório',
                description: 'Por favor, informe o motivo da inativação.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            if (onStatusChange) {
                await onStatusChange(newStatus, reason);
            }

            toast({
                title: newStatus === 'ACTIVE' ? 'Aluno ativado' : 'Aluno inativado',
                description: newStatus === 'ACTIVE'
                    ? `${studentName} foi reativado com sucesso.`
                    : `${studentName} foi inativado. Motivo: ${reason}`,
            });

            setReason('');
            setIsOpen(false);
        } catch (error) {
            console.error('Error changing student status:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível alterar o status do aluno. Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {triggerButton || (
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "rounded-full transition-all duration-300",
                            isActive
                                ? 'text-red-500 hover:text-red-600 hover:border-red-500/50 hover:bg-red-500/10'
                                : 'text-green-500 hover:text-green-600 hover:border-green-500/50 hover:bg-green-500/10'
                        )}
                    >
                        {isActive ? <Trash2 className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md p-0 overflow-hidden border-l border-slate-100 shadow-2xl flex flex-col h-full bg-white">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className={cn(
                            "flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner transition-all",
                            isActive
                                ? "bg-red-50 border-red-100 text-red-500"
                                : "bg-green-50 border-green-100 text-green-500"
                        )}>
                            {isActive ? <Trash2 className="h-8 w-8" /> : <UserCheck className="h-8 w-8" />}
                        </div>
                        <div className="space-y-1">
                            <SheetTitle className="text-xl font-bold font-display tracking-tight text-bee-midnight leading-tight">
                                {isActive ? 'Inativar aluno' : 'Ativar aluno'}
                            </SheetTitle>
                            <SheetDescription className="text-sm font-medium text-slate-500">
                                {isActive ? 'Suspender temporariamente o acesso' : 'Restaurar acesso ao sistema'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                        {isActive ? (
                            <>
                                Ao inativar <strong>{studentName}</strong>, ele não poderá agendar novos treinos e os treinos futuros
                                serão cancelados. Seus dados e histórico serão preservados na plataforma.
                            </>
                        ) : (
                            <>
                                Ao ativar <strong>{studentName}</strong>, ele poderá voltar a agendar treinos e o plano ficará ativo
                                novamente. O histórico de atividades será mantido integralmente.
                            </>
                        )}
                    </p>

                    {newStatus === 'INACTIVE' && (
                        <div className="space-y-2 py-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <Label htmlFor="reason" className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                Motivo da inativação *
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Descreva o motivo (Ex: Mudança, questões financeiras...)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="min-h-[120px] resize-none border-slate-200 focus:border-bee-amber focus:ring-bee-amber/20 bg-white"
                                disabled={isLoading}
                            />
                            <p className="text-[10px] text-slate-400 italic">
                                Este registro ficará disponível no histórico interno do aluno.
                            </p>
                        </div>
                    )}
                </div>

                <SheetFooter className="p-6 bg-slate-50/50 border-t shrink-0 flex flex-row items-center gap-3 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none text-slate-500 hover:bg-slate-100 font-bold h-10 rounded-full uppercase text-xs"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 sm:flex-none h-10 rounded-full px-8 shadow-lg transition-all active:scale-95 font-black uppercase text-xs",
                            isActive
                                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200/50"
                                : "bg-bee-amber hover:bg-amber-500 text-bee-midnight shadow-amber-200/50"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4 hidden" /> {/* Placeholder for consistent icon spacing if needed */}
                                {isActive ? 'Confirmar Inativação' : 'Confirmar Ativação'}
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
