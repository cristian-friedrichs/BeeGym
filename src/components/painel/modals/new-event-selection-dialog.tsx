import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ClipboardList, Dumbbell, Sparkles } from "lucide-react";

interface NewEventSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (type: 'class' | 'workout') => void;
}

export function NewEventSelectionDialog({ open, onOpenChange, onSelect }: NewEventSelectionDialogProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-[450px] border-l shadow-2xl p-0 flex flex-col h-full bg-white">
                <SheetHeader className="p-8 border-b relative overflow-hidden shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-bee-amber/[0.03] rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-bee-amber/[0.05] rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />
                    <div className="flex items-center gap-5 relative text-left">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bee-amber/20 via-bee-amber/10 to-transparent border border-bee-amber/20 shadow-inner group transition-all">
                            <Sparkles className="h-8 w-8 text-bee-amber drop-shadow-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-2xl font-black font-display tracking-tight text-bee-midnight">
                                Novo Evento
                            </SheetTitle>
                            <SheetDescription className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-bee-amber animate-pulse" />
                                Escolha o tipo de agendamento para adicionar.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 p-8 space-y-6 flex flex-col justify-center">
                    <div className="grid grid-cols-1 gap-4">
                        <Button
                            variant="outline"
                            className="h-40 flex flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-bee-amber hover:bg-amber-50/30 transition-all group relative overflow-hidden shadow-sm"
                            onClick={() => onSelect('class')}
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-orange-100/40 transition-colors" />
                            <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shadow-md">
                                <ClipboardList className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-xl text-deep-midnight">Aula Coletiva</span>
                                <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Yoga, HIIT, Dança e mais</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-40 flex flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50/30 transition-all group relative overflow-hidden shadow-sm"
                            onClick={() => onSelect('workout')}
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/20 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-blue-100/40 transition-colors" />
                            <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-md">
                                <Dumbbell className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-xl text-deep-midnight">Treino Individual</span>
                                <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Duração personalizada</span>
                            </div>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
