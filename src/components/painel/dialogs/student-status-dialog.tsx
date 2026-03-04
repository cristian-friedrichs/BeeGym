'use client';

import { useState } from 'react';
import { Trash2, UserCheck } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                {triggerButton || (
                    <Button
                        variant="outline"
                        size="icon"
                        className={
                            isActive
                                ? 'rounded-full text-destructive hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10'
                                : 'rounded-full text-green-500 hover:text-green-600 hover:border-green-500/50 hover:bg-green-500/10'
                        }
                    >
                        {isActive ? <Trash2 className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                    </Button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[500px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isActive ? 'Inativar aluno' : 'Ativar aluno'}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isActive ? (
                            <>
                                Ao inativar <strong>{studentName}</strong>, ele não poderá agendar novos treinos e os treinos futuros
                                serão cancelados. Seus dados e histórico serão preservados.
                            </>
                        ) : (
                            <>
                                Ao ativar <strong>{studentName}</strong>, ele poderá voltar a agendar treinos e o plano ficará ativo
                                novamente. O histórico será mantido.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {newStatus === 'INACTIVE' && (
                    <div className="space-y-2 py-4">
                        <Label htmlFor="reason" className="text-sm font-medium">
                            Motivo do cancelamento *
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Ex: Mudança de cidade, questões financeiras, insatisfação com serviço..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px] resize-none"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Este motivo será registrado no histórico do aluno.
                        </p>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
                        {isLoading
                            ? 'Processando...'
                            : isActive
                                ? 'Confirmar Inativação'
                                : 'Confirmar Ativação'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
