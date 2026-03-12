import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <DialogHeader className="relative p-0 mb-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-bee-midnight via-slate-900 to-bee-midnight" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-bee-amber/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-bee-amber/5 rounded-full blur-3xl" />

                    <div className="relative px-8 pt-10 pb-8 flex flex-col gap-4 text-left">
                        <div className="flex items-center justify-between font-display">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-bee-amber to-amber-600 p-[1px] shadow-lg shadow-bee-amber/20 group animate-in zoom-in-50 duration-500">
                                    <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-bee-midnight/90 backdrop-blur-xl transition-colors group-hover:bg-bee-midnight/40">
                                        <Lock className="h-7 w-7 text-bee-amber animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <DialogTitle className="text-3xl font-black text-white tracking-tight leading-none font-display mb-2">
                                        Premium
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-bee-amber/10 text-bee-amber border-bee-amber/30 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-sans">
                                            Exclusivo
                                        </Badge>
                                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                                        <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider font-sans">
                                            Recurso do Plano Individual
                                        </span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bee-amber/20 to-transparent" />
                </DialogHeader>

                <div className="p-8 flex flex-col items-center text-center space-y-6">
                    <div className="space-y-4">
                        <p className="text-slate-600 font-sans text-base leading-relaxed max-w-[340px]">
                            {featureName
                                ? <>O recurso <span className="font-bold text-slate-900">{featureName}</span> não está disponível no seu plano atual.</>
                                : <>Esta funcionalidade não está disponível no seu plano atual.</>
                            }
                        </p>
                        <p className="text-sm text-slate-400 font-medium italic">
                            Faça upgrade para liberar mais recursos e expandir seus negócios com a BeeGym!
                        </p>
                    </div>
                    <div className="w-full grid grid-cols-1 gap-3 pt-2">
                        <Button
                            onClick={() => {
                                onOpenChange(false)
                                router.push('/app/configuracoes/subscription')
                            }}
                            className="w-full bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold h-12 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                            <Crown className="w-5 h-5" />
                            Ver Planos e Upgrade
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold h-11 rounded-full transition-all"
                        >
                            Agora Não
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
