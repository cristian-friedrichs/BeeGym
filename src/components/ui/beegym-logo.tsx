'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface BeeGymLogoProps {
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

export function BeeGymLogo({
    variant = 'light',
    size = 'md',
    showIcon = true,
    className
}: BeeGymLogoProps) {
    const [imgError, setImgError] = useState(false);

    const sizeClasses = {
        sm: 'text-xl gap-2',
        md: 'text-3xl gap-2.5',
        lg: 'text-5xl gap-4',
    };

    const iconSizes = {
        sm: 'h-7 w-7',
        md: 'h-10 w-10',
        lg: 'h-16 w-16',
    };

    // Width estimates for the Image component (ratio ~3:1)
    const dimensions = {
        sm: { width: 80, height: 28 },
        md: { width: 120, height: 40 },
        lg: { width: 180, height: 60 },
    };

    return (
        <div className={cn('flex items-center', className)}>
            {!imgError ? (
                <div className={cn('relative flex items-center', size === 'sm' ? 'h-6' : size === 'md' ? 'h-10' : 'h-16')}>
                    <Image
                        src={variant === 'dark' ? '/logo-white.png' : '/Logo Vertical.png'}
                        alt="BeeGym"
                        width={dimensions[size].width}
                        height={dimensions[size].height}
                        className="h-full w-auto object-contain"
                        onError={() => setImgError(true)}
                        priority
                    />
                </div>
            ) : (
                <div className={cn(
                    "flex items-center justify-center bg-red-100 text-red-600 border border-red-500 font-bold rounded px-2 text-center",
                    size === 'sm' ? 'h-6 text-[10px]' : size === 'md' ? 'h-10 text-xs' : 'h-16 text-sm'
                )}>
                    Salve a imagem na pasta <br /> public/{variant === 'dark' ? 'logo-white.png' : 'Logo Vertical.png'}
                </div>
            )}
        </div>
    );
}
