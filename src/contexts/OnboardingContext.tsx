'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'

interface OnboardingData {
    businessType: string
    organizationName: string
    documentType: 'CPF' | 'CNPJ'
    document: string
    phone: string
    email: string
    studentRange: string
    hasPhysicalLocation: boolean
    addressZip: string
    addressLine1: string
    addressNumber: string
    addressComplement: string
    addressNeighborhood: string
    addressCity: string
    addressState: string
    planId: string
    currentStep: number
}

interface OnboardingContextType {
    data: OnboardingData
    updateData: (updates: Partial<OnboardingData>) => void
    resetData: () => void
    isHydrated: boolean
}

const STORAGE_KEY = 'bee_onboarding_draft'

const initialData: OnboardingData = {
    businessType: '',
    organizationName: '',
    documentType: 'CPF',
    document: '',
    phone: '',
    email: '',
    studentRange: '',
    hasPhysicalLocation: false,
    addressZip: '',
    addressLine1: '',
    addressNumber: '',
    addressComplement: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
    planId: '',
    currentStep: 1,
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
