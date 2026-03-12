'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BeeGymLogo } from '@/components/ui/beegym-logo';
import { useEffect, useState } from 'react';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-soft py-3' : 'bg-transparent py-5'}`}>
            <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                <Link href="/" className="flex items-center transition-transform hover:scale-105 active:scale-95">
                    <BeeGymLogo size="md" className="text-bee-amber" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-700">
                    <Link href="/recursos" className="hover:text-bee-midnight transition-colors">Recursos</Link>
                    <Link href="/para-quem-e" className="hover:text-bee-midnight transition-colors">Para quem é</Link>
                    <Link href="/planos" className="hover:text-bee-midnight transition-colors">Planos</Link>
                    <Link href="/faq" className="hover:text-bee-midnight transition-colors">FAQ</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden md:block text-sm font-semibold text-bee-midnight hover:-translate-y-0.5 transition-all">
                        Login
                    </Link>
                    <Link href="/register">
                        <Button className="bg-bee-amber text-bee-midnight font-bold rounded-full px-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                            Crie uma Conta
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
