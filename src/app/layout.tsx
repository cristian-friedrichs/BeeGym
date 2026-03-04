import type { Metadata } from 'next';
import { Poppins, Roboto } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { validateEnv } from '@/lib/env';
import { AuthProvider } from '@/lib/auth/AuthContext';

// Validate env vars at startup
validateEnv();

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
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
      className={cn(poppins.variable, roboto.variable)}
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
