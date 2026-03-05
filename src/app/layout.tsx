import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { validateEnv } from '@/lib/env';
import { AuthProvider } from '@/lib/auth/AuthContext';

// Validate env vars at startup
validateEnv();

// Inter — BeeGym Brand UI & Body Font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BeeGym Pro - Gestão para Personal Trainers',
  description: 'A ferramenta essencial para personal trainers que buscam profissionalismo e escala.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(inter.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
