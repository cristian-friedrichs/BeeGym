'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserProfile {
    id: string
    full_name: string | null
    email: string | null
    role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'STAFF'
    organization_id: string
    avatar_url: string | null
    status: 'active' | 'pending' | 'trial' | 'past_due' | 'canceled'
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    isAdmin: boolean
    isInstructor: boolean
    organizationId: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('id, full_name, email, role, organization_id, avatar_url, status')
                .eq('id', userId)
                .single()

            if (error) {
                // PGRST116 means no rows found - common for new users in onboarding
                if (error.code === 'PGRST116') {
                    return null
                }
                throw error
            }

            // 🔒 VALIDAÇÃO: Usuário DEVE ter organization_id
            if (!data?.organization_id) {
                console.warn('⚠️ Usuário sem organization_id - o middleware deve redirecionar para onboarding')
                return data as UserProfile
            }

            // Retorna o profile independente do status — o layout e middleware gerenciam o acesso
            return data as UserProfile
        } catch (error: any) {
            // AbortError variants: Web Locks "steal", fetch abort, Supabase internal cancellation
            const isAbort =
                error.name === 'AbortError' ||
                error instanceof DOMException ||
                error.message?.includes('Lock broken') ||
                error.message?.includes('aborted') ||
                error.message?.includes('AbortError')
            if (isAbort) return null

            // Only log real unexpected errors
            if (error.code !== 'PGRST116') {
                console.error('❌ Erro ao buscar perfil:', error.message || error)
            }
            return null
        }
    }

    const refreshProfile = async () => {
        if (user) {
            const profileData = await fetchProfile(user.id)
            setProfile(profileData)
        }
    }

    useEffect(() => {
        let isMounted = true

        // Safety net: if auth doesn't resolve in 8s, unblock the app
        const safetyTimeout = setTimeout(() => {
            if (isMounted) {
                console.warn('[AuthContext] Safety timeout triggered — forcing loading=false')
                setLoading(false)
            }
        }, 8000)

        const initializeAuth = async () => {
            try {
                // 1. Check initial session
                const { data: { session } } = await supabase.auth.getSession()

                if (!isMounted) return

                if (session?.user) {
                    setUser(session.user)
                    const profileData = await fetchProfile(session.user.id)
                    if (isMounted) setProfile(profileData)
                } else {
                    if (isMounted) {
                        setUser(null)
                        setProfile(null)
                    }
                }
            } catch (error: any) {
                if (isMounted && error.name !== 'AbortError') {
                    console.error('Erro na inicialização do auth:', error)
                }
            } finally {
                clearTimeout(safetyTimeout)
                if (isMounted) setLoading(false)
            }
        }

        initializeAuth()

        // 2. Setup listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return
            if (event === 'INITIAL_SESSION') return

            try {
                if (isMounted) setUser(session?.user ?? null)

                if (session?.user) {
                    const profileData = await fetchProfile(session.user.id)
                    if (isMounted) setProfile(profileData)
                } else {
                    if (isMounted) setProfile(null)
                }
            } catch (e: any) {
                // Swallow lock/abort errors from concurrent auth state changes
                if (!e.message?.includes('Lock broken') && e.name !== 'AbortError') {
                    console.error('[AuthContext] onAuthStateChange error:', e.message)
                }
            } finally {
                if (isMounted) setLoading(false)
            }
        })

        return () => {
            isMounted = false
            clearTimeout(safetyTimeout)
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/login')
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                signOut,
                refreshProfile,
                isAdmin: profile?.role === 'ADMIN',
                isInstructor: profile?.role === 'INSTRUCTOR' || profile?.role === 'ADMIN',
                organizationId: profile?.organization_id ?? null,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth deve se usado dentro de AuthProvider')
    }
    return context
}
