'use client';

import { ReactNode } from 'react';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-1 h-6 bg-[#FFBF00] rounded-full shrink-0" />
                <div className="min-w-0">
                    <h2 className="text-base font-bold text-[#0B0F1A] font-display truncate">{title}</h2>
                    {subtitle && <p className="hidden sm:block text-xs text-slate-400 truncate">{subtitle}</p>}
                </div>
            </div>
            {action && (
                <div className="flex items-center gap-3 shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}
