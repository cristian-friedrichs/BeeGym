'use client';

import * as React from 'react';
import { Drawer } from 'vaul';
import {
    Dialog,
    DialogContent,
    DialogHeader as ShadDialogHeader,
    DialogTitle as ShadDialogTitle,
    DialogDescription as ShadDialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Hook: true when viewport < 640px (Tailwind `sm` breakpoint).
function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);
    return isMobile;
}

interface ResponsiveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    /** Set false to disable swipe/tap-outside dismissal (e.g. when form is dirty and you want a confirm step). */
    dismissible?: boolean;
}

export function ResponsiveDialog({ open, onOpenChange, children, dismissible = true }: ResponsiveDialogProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                    <Drawer.Content
                        className={cn(
                            'fixed bottom-0 left-0 right-0 z-50',
                            'flex flex-col bg-white',
                            'rounded-t-3xl',
                            'h-[92dvh]',
                            'outline-none',
                            'shadow-[0_-8px_32px_rgba(0,0,0,0.12)]'
                        )}
                    >
                        <Drawer.Title className="sr-only">Dialog</Drawer.Title>
                        {/* Drag handle */}
                        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-slate-200" />
                        {children}
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-[576px] w-full p-0 gap-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[90vh]"
                onInteractOutside={(e) => { if (!dismissible) e.preventDefault(); }}
                onEscapeKeyDown={(e) => { if (!dismissible) e.preventDefault(); }}
            >
                <ShadDialogTitle className="sr-only">Dialog</ShadDialogTitle>
                {children}
            </DialogContent>
        </Dialog>
    );
}

// ── Slots ─────────────────────────────────────────────────────────────────────
// Use these instead of the shadcn DialogHeader/Title/Description inside a
// ResponsiveDialog so styling is consistent on both surfaces.

export function ResponsiveDialogHeader({
    title,
    description,
    onClose,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    onClose?: () => void;
}) {
    return (
        <div className="shrink-0 px-5 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-slate-100 bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-[17px] font-semibold text-slate-900 leading-tight">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-sm text-slate-500 mt-1 leading-snug">{description}</p>
                    )}
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="shrink-0 -mt-1 -mr-1 h-9 w-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export function ResponsiveDialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'flex-1 overflow-y-auto overscroll-contain',
                'px-5 sm:px-6 py-5',
                'space-y-5',
                className
            )}
            // Allow drag-to-dismiss on vaul only when scrolled to top
            data-vaul-no-drag
        >
            {children}
        </div>
    );
}

export function ResponsiveDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'shrink-0 border-t border-slate-100 bg-white',
                'px-5 sm:px-6',
                'pt-3 sm:pt-4',
                'pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5',
                'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3',
                className
            )}
        >
            {children}
        </div>
    );
}
