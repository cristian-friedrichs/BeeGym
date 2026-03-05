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
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
                <div>
                    <h2 className="text-base font-bold text-[#0B0F1A] font-display">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                </div>
            </div>
            {action && (
                <div className="flex items-center gap-3">
                    {action}
                </div>
            )}
        </div>
    );
}
