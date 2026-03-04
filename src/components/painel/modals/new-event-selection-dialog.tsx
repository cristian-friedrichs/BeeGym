import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, Dumbbell } from "lucide-react";

interface NewEventSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (type: 'class' | 'workout') => void;
}

export function NewEventSelectionDialog({ open, onOpenChange, onSelect }: NewEventSelectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-center font-display text-xl">O que você deseja agendar?</DialogTitle>
                    <DialogDescription className="text-center">
                        Escolha o tipo de evento para adicionar ao calendário.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                        variant="outline"
                        className="h-32 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={() => onSelect('class')}
                    >
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-lg">Aula</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-32 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all"
                        onClick={() => onSelect('workout')}
                    >
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Dumbbell className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-lg">Treino</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
