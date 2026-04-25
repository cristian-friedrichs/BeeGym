'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'

interface OnboardingData {
    organizationName: string
    studentRange: string
    planId: string
}

interface OnboardingContextType {
    data: OnboardingData
    updateData: (updates: Partial<OnboardingData>) => void
    resetData: () => void
    isHydrated: boolean
}

const STORAGE_KEY = 'bee_onboarding_draft'

const initialData: OnboardingData = {
    organizationName: '',
    studentRange: '',
    planId: '',
}

function loadFromStorage(): OnboardingData {
    if (typeof window === 'undefined') return initialData
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return initialData
        return { ...initialData, ...JSON.parse(raw) }
    } catch {
        return initialData
    }
}

function saveToStorage(data: OnboardingData) {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
        // Storage full or unavailable
    }
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<OnboardingData>(initialData)
    const [isHydrated, setIsHydrated] = useState(false)

    // Hydrate from localStorage on mount
    useEffect(() => {
        const stored = loadFromStorage()
        setData(stored)
        setIsHydrated(true)
    }, [])

    const updateData = useCallback((updates: Partial<OnboardingData>) => {
        setData(prev => {
            const next = { ...prev, ...updates }
            saveToStorage(next)
            return next
        })
    }, [])

    const resetData = useCallback(() => {
        setData(initialData)
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

    const value = useMemo(() => ({
        data,
        updateData,
        resetData,
        isHydrated
    }), [data, isHydrated])

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider')
    }
    return context
}
