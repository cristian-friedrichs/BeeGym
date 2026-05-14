import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ClipboardList, Dumbbell, Sparkles } from "lucide-react";

interface NewEventSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (type: 'class' | 'workout') => void;
}

export function NewEventSelectionDialog({ open, onOpenChange, onSelect }: NewEventSelectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                {/* Header */}
                <DialogHeader className="px-8 pt-8 pb-6 border-b border-slate-100 relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-bee-amber/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-4 relative">
                        <div className="h-12 w-12 rounded-2xl bg-bee-amber/15 border border-bee-amber/20 flex items-center justify-center shrink-0">
                            <Sparkles className="h-6 w-6 text-bee-amber" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black font-display tracking-tight text-bee-midnight">
                                Nova Atividade
                            </DialogTitle>
                            <DialogDescription className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Escolha o tipo de agendamento
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Options */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onSelect('class')}
                        className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-orange-300 hover:bg-orange-50/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                    >
                        <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform shadow-sm">
                            <ClipboardList className="h-7 w-7" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-sm text-slate-800">Aula Coletiva</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 block">
                                Yoga, HIIT e mais
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelect('workout')}
                        className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                    >
                        <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform shadow-sm">
                            <Dumbbell className="h-7 w-7" />
                        </div>
                        <div className="text-center">
                            <span className="block font-bold text-sm text-slate-800">Treino Individual</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5 block">
                                Personalizado
                            </span>
                        </div>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
