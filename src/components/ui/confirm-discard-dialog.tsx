'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDiscardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function ConfirmDiscardDialog({ open, onOpenChange, onConfirm }: ConfirmDiscardDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-[24px] border-none shadow-2xl max-w-[380px] p-8">
                <AlertDialogHeader className="space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="h-7 w-7 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <AlertDialogTitle className="text-xl font-bold text-slate-900 text-center">
                            Descartar alterações?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-center text-sm leading-relaxed">
                            Você tem alterações não salvas. Se sair agora, todos os dados preenchidos serão perdidos permanentemente.
                        </AlertDialogDescription>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-3 sm:gap-3 sm:flex-row flex-col">
                    <AlertDialogCancel className="h-11 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold sm:flex-1 transition-all">
                        Continuar editando
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="h-11 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-md shadow-red-200 sm:flex-1 transition-all border-none"
                    >
                        Sim, descartar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
