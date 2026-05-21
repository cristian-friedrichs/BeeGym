'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Power, Loader2, X } from 'lucide-react';
import {
    ResponsiveDialog,
    ResponsiveDialogHeader,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type StudentStatusDialogProps = {
    studentId: string;
    studentName: string;
    currentStatus: 'ACTIVE' | 'INACTIVE' | 'OVERDUE' | string;
    triggerButton?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onStatusChange?: (newStatus: 'ACTIVE' | 'INACTIVE', reason?: string) => void | Promise<void>;
};

export function StudentStatusDialog({
    studentId,
    studentName,
    currentStatus,
    triggerButton,
    open: openProp,
    onOpenChange: onOpenChangeProp,
    onStatusChange,
}: StudentStatusDialogProps) {
    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const [reasonOption, setReasonOption] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const isOpen = openProp !== undefined ? openProp : isOpenInternal;
    const setIsOpen = onOpenChangeProp !== undefined ? onOpenChangeProp : setIsOpenInternal;

    const isActiveOrOverdue = currentStatus === 'ACTIVE' || currentStatus === 'OVERDUE';
    const newStatus = isActiveOrOverdue ? 'INACTIVE' : 'ACTIVE';

    // Clear state on open/close transition
    useEffect(() => {
        if (!isOpen) {
            setReasonOption('');
            setCustomReason('');
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        const finalReason = reasonOption === 'Outros' ? customReason : reasonOption;
        
        // Validate reason when inactivating
        if (newStatus === 'INACTIVE' && !finalReason.trim()) {
            toast({
                title: 'Motivo obrigatório',
                description: 'Por favor, selecione ou especifique o motivo da inativação.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            if (onStatusChange) {
                await onStatusChange(newStatus, newStatus === 'INACTIVE' ? finalReason : undefined);
            }

            toast({
                title: newStatus === 'ACTIVE' ? 'Aluno ativado' : 'Aluno inativado',
                description: newStatus === 'ACTIVE'
                    ? `${studentName} foi reativado com sucesso.`
                    : `${studentName} foi inativado. Motivo: ${finalReason}`,
            });

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

    const trigger = React.isValidElement(triggerButton) ? (
        React.cloneElement(triggerButton as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                setIsOpen(true);
                if ((triggerButton as any).props?.onClick) {
                    (triggerButton as any).props.onClick(e);
                }
            }
        })
    ) : (
        <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
            }}
            className={cn(
                "h-9 w-9 rounded-xl transition-all border border-transparent shadow-none",
                isActiveOrOverdue
                    ? 'text-bee-midnight hover:bg-red-50 hover:text-red-500 hover:border-red-100'
                    : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
            )}
        >
            <Power className="w-4 h-4" />
        </Button>
    );

    return (
        <>
            {trigger}
            <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
                <ResponsiveDialogHeader
                    title={newStatus === 'INACTIVE' ? 'Inativar Aluno' : 'Ativar Aluno'}
                    description={newStatus === 'INACTIVE' ? 'Confirmar a suspensão de acesso do aluno' : 'Confirmar o retorno do acesso do aluno'}
                    onClose={() => setIsOpen(false)}
                />
                
                <ResponsiveDialogBody className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                        {newStatus === 'INACTIVE' ? (
                            <>
                                Tem certeza que deseja inativar o(a) aluno(a) <strong>{studentName}</strong>? Ele(a) perderá acesso imediato ao aplicativo e seus treinos futuros serão cancelados.
                            </>
                        ) : (
                            <>
                                Tem certeza que deseja ativar o(a) aluno(a) <strong>{studentName}</strong>? Ele(a) recuperará acesso imediato ao aplicativo e planos ativos.
                            </>
                        )}
                    </p>

                    {newStatus === 'INACTIVE' && (
                        <div className="space-y-4 p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="space-y-2">
                                <Label htmlFor="reason-select" className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    Motivo da inativação *
                                </Label>
                                <Select value={reasonOption} onValueChange={setReasonOption}>
                                    <SelectTrigger id="reason-select" className="w-full h-10 border-slate-200 focus:border-bee-amber focus:ring-bee-amber/20 bg-white">
                                        <SelectValue placeholder="Selecione um motivo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dificuldades financeiras">Dificuldades financeiras</SelectItem>
                                        <SelectItem value="Problemas de saúde / lesão">Problemas de saúde / lesão</SelectItem>
                                        <SelectItem value="Falta de tempo / mudança de rotina">Falta de tempo / mudança de rotina</SelectItem>
                                        <SelectItem value="Mudança de cidade / endereço">Mudança de cidade / endereço</SelectItem>
                                        <SelectItem value="Insatisfação com o serviço / estrutura">Insatisfação com o serviço / estrutura</SelectItem>
                                        <SelectItem value="Não responde às tentativas de contato">Não responde às tentativas de contato</SelectItem>
                                        <SelectItem value="Outros">Outros (especificar)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {reasonOption === 'Outros' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label htmlFor="custom-reason" className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                        Especifique o motivo *
                                    </Label>
                                    <Textarea
                                        id="custom-reason"
                                        placeholder="Descreva detalhadamente o motivo da inativação..."
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        className="min-h-[90px] resize-none border-slate-200 focus:border-bee-amber focus:ring-bee-amber/20 bg-white"
                                        disabled={isLoading}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </ResponsiveDialogBody>

                <ResponsiveDialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                        className="text-slate-500 hover:bg-slate-100 font-bold h-10 rounded-full uppercase text-xs sm:w-auto w-full"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={cn(
                            "h-10 rounded-full px-8 shadow-lg transition-all active:scale-95 font-black uppercase text-xs sm:w-auto w-full",
                            newStatus === 'INACTIVE'
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
                                {newStatus === 'INACTIVE' ? 'Confirmar Inativação' : 'Confirmar Ativação'}
                            </>
                        )}
                    </Button>
                </ResponsiveDialogFooter>
            </ResponsiveDialog>
        </>
    );
}
