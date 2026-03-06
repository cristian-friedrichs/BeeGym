import Link from 'next/link';
import { BeeGymLogo } from '@/components/ui/beegym-logo';

export function Footer() {
    return (
        <footer className="bg-bee-midnight text-slate-400 py-16 border-t border-white/10">
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">

                    <div className="flex flex-col items-center md:items-start gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <BeeGymLogo className="h-8 w-8 text-bee-amber" />
                        </Link>
                        <p className="text-sm">Plataforma SaaS de Gestão para Academias.</p>
                    </div>

                    <div className="flex items-center gap-8 text-sm font-medium">
                        <Link href="#recursos" className="hover:text-white transition-colors">Termos de Uso</Link>
                        <Link href="#para-quem" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="/login" className="hover:text-white transition-colors">Painel Admin</Link>
                    </div>

                </div>

                <div className="mt-16 pt-8 border-t border-white/10 text-center text-sm">
                    <p>© {new Date().getFullYear()} BeeGym. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
