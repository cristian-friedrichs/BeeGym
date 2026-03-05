'use client'

import React from 'react'
import { BeeGymLogo } from '@/components/ui/beegym-logo'

interface OnboardingProgressProps {
    currentStep: number
    totalSteps?: number
}

export function OnboardingProgress({ currentStep, totalSteps = 4 }: OnboardingProgressProps) {
    return (
        <div className="flex items-center justify-between w-full mb-8">
            <div className="flex items-center">
                <BeeGymLogo size="md" />
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                    {Array.from({ length: totalSteps }).map((_, i) => {
                        const stepNum = i + 1
                        const isActive = stepNum <= currentStep
                        const isCurrent = stepNum === currentStep

                        return (
                            <div
                                key={stepNum}
                                className={`h-1.5 rounded-full transition-all duration-500 ${isActive
                                    ? 'bg-bee-amber ' + (isCurrent ? 'w-8' : 'w-4')
                                    : 'bg-slate-200 w-3'
                                    }`}
                            />
                        )
                    })}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Etapa {currentStep} de {totalSteps}
                </span>
            </div>
        </div>
    )
}
