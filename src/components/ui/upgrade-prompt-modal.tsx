import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Crown } from "lucide-react"
import { useRouter } from "next/navigation"

interface UpgradePromptModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    featureName?: string
}

export function UpgradePromptModal({ open, onOpenChange, featureName }: UpgradePromptModalProps) {
    const router = useRouter()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md pt-8 pb-6 px-6 sm:px-8 border-slate-100 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mb-2">
                        <Lock className="h-8 w-8 text-bee-amber" />
                    </div>

                    <DialogHeader className="space-y-2 w-full text-center sm:text-center">
                        <DialogTitle className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                            Funcionalidade Bloqueada
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-sans text-[15px] leading-relaxed">
                            {featureName
                                ? <>O recurso <strong>{featureName}</strong> não está disponível no seu plano atual.</>
                                : <>Esta funcionalidade não está disponível no seu plano atual.</>
                            }
                            <br /><br />
                            Faça upgrade para liberar mais recursos e expandir seus negócios com a BeeGym!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="w-full pt-4 flex flex-col gap-3">
                        <Button
                            onClick={() => {
                                onOpenChange(false)
                                router.push('/app/configuracoes/subscription')
                            }}
                            className="w-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Crown className="w-5 h-5" />
                            Ver Planos e Fazer Upgrade
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold h-12 rounded-xl"
                        >
                            Talvez Mais Tarde
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
