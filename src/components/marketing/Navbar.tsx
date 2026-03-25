'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BeeGymLogo } from '@/components/ui/beegym-logo';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
    { href: '/recursos', label: 'Recursos' },
    { href: '/para-quem-e', label: 'Para quem é' },
    { href: '/planos', label: 'Planos' },
    { href: '/faq', label: 'FAQ' },
];

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handle = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handle);
        return () => window.removeEventListener('scroll', handle);
    }, []);

    return (
        <header
            id="navbar"
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-[#0B0F1A]/95 backdrop-blur-md border-b border-white/5 py-3'
                    : 'bg-transparent py-5'
            }`}
        >
            <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <BeeGymLogo size="md" variant="dark" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-400">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="hover:text-white transition-colors duration-200 tracking-wide"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/login"
                        className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                        Entrar
                    </Link>
                    <Link href="/register">
                        <Button
                            id="navbar-cta"
                            className="bg-bee-amber text-bee-midnight font-bold rounded-full px-6 text-sm tracking-widest uppercase hover:bg-[#E67E22] hover:-translate-y-0.5 transition-all duration-200 shadow-[0_0_20px_rgba(255,191,0,0.3)]"
                        >
                            Começar Agora
                        </Button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    id="mobile-menu-toggle"
                    className="md:hidden text-white p-1"
                    onClick={() => setOpen(!open)}
                    aria-label="Menu"
                >
                    {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {open && (
                <div className="md:hidden bg-[#0B0F1A] border-t border-white/5 px-6 py-6 flex flex-col gap-4">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-slate-300 hover:text-white font-medium text-base"
                            onClick={() => setOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <hr className="border-white/10 my-2" />
                    <Link href="/login" className="text-slate-400 font-medium" onClick={() => setOpen(false)}>
                        Entrar
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)}>
                        <Button
                            id="mobile-nav-cta"
                            className="w-full bg-bee-amber text-bee-midnight font-bold rounded-full tracking-widest uppercase"
                        >
                            Começar Agora
                        </Button>
                    </Link>
                </div>
            )}
        </header>
    );
}
