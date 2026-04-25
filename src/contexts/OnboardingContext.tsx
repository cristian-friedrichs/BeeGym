'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface OnboardingData {
    organizationName: string
    phone: string
    documentId: string
    studentRange: string
    planId: string
}

interface OnboardingContextType {
    data: OnboardingData
    updateData: (updates: Partial<OnboardingData>) => void
    resetData: () => void
    isHydrated: boolean
}

const STORAGE_PREFIX = 'bee_onboarding_draft_'

const initialData: OnboardingData = {
    organizationName: '',
    phone: '',
    documentId: '',
    studentRange: '',
    planId: '',
}

function loadFromStorage(userId: string): OnboardingData {
    if (typeof window === 'undefined' || !userId) return initialData
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`)
        if (!raw) return initialData
        return { ...initialData, ...JSON.parse(raw) }
    } catch {
        return initialData
    }
}

function saveToStorage(userId: string, data: OnboardingData) {
    if (typeof window === 'undefined' || !userId) return
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(data))
    } catch {
        // Storage full or unavailable
    }
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const userId = user?.id || ''
    
    const [data, setData] = useState<OnboardingData>(initialData)
    const [isHydrated, setIsHydrated] = useState(false)

    // Hydrate from localStorage when user changes
    useEffect(() => {
        if (userId) {
            const stored = loadFromStorage(userId)
            setData(stored)
            setIsHydrated(true)
        } else {
            setData(initialData)
            setIsHydrated(true)
        }
    }, [userId])

    const updateData = useCallback((updates: Partial<OnboardingData>) => {
        setData(prev => {
            const next = { ...prev, ...updates }
            if (userId) saveToStorage(userId, next)
            return next
        })
    }, [userId])

    const resetData = useCallback(() => {
        setData(initialData)
        if (typeof window !== 'undefined' && userId) {
            localStorage.removeItem(`${STORAGE_PREFIX}${userId}`)
        }
    }, [userId])

    const value = useMemo(() => ({
        data,
        updateData,
        resetData,
        isHydrated
    }), [data, isHydrated, updateData, resetData])

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
