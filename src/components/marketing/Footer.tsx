import Link from 'next/link';
import { BeeGymLogo } from '@/components/ui/beegym-logo';

const LINKS_PRODUCT = [
    { label: 'Recursos', href: '/recursos' },
    { label: 'Planos', href: '/planos' },
    { label: 'Para quem é', href: '/para-quem-e' },
    { label: 'FAQ', href: '/faq' },
];

const LINKS_LEGAL = [
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Privacidade', href: '/privacidade' },
];

const LINKS_ACCOUNT = [
    { label: 'Criar conta', href: '/register' },
    { label: 'Fazer login', href: '/login' },
    { label: 'Painel Admin', href: '/admin/login' },
];

export function Footer() {
    return (
        <footer className="bg-[#090D16] text-slate-500 border-t border-white/5">
            <div className="container mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center mb-4">
                            <BeeGymLogo variant="dark" size="sm" />
                        </Link>
                        <p className="text-sm leading-relaxed">
                            A plataforma SaaS de gestão para Personal Trainers, Studios e Academias.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Produto</p>
                        <ul className="space-y-3">
                            {LINKS_PRODUCT.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} className="text-sm hover:text-white transition-colors">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Conta */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Conta</p>
                        <ul className="space-y-3">
                            {LINKS_ACCOUNT.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} className="text-sm hover:text-white transition-colors">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">Legal</p>
                        <ul className="space-y-3">
                            {LINKS_LEGAL.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} className="text-sm hover:text-white transition-colors">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>© {new Date().getFullYear()} BeeGym. Todos os direitos reservados.</p>
                    <p className="text-slate-700">
                        Feito com muito café ☕ para o fitness brasileiro.
                    </p>
                </div>
            </div>
        </footer>
    );
}
