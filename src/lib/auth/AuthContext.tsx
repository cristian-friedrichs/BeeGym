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

            // 🔒 VALIDAÇÃO: Conta deve estar ACTIVE (case-insensitive — DB stores uppercase)
            const activeStatuses = ['active', 'trial', 'past_due']
            if (!activeStatuses.includes(data.status?.toLowerCase())) {
                console.warn('⚠️ Conta não está ativa - o middleware deve gerenciar o acesso')
                return null
            }

            return data as UserProfile
        } catch (error: any) {
            if (error.name === 'AbortError') return null
            console.error('❌ Erro detalhado ao buscar perfil:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
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
                if (isMounted) setLoading(false)
            }
        }

        initializeAuth()

        // 2. Setup listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return

            // Avoid double-processing the INITIAL_SESSION event since we handled it in initializeAuth
            if (event === 'INITIAL_SESSION') return

            if (isMounted) setUser(session?.user ?? null)

            if (session?.user) {
                const profileData = await fetchProfile(session.user.id)
                if (isMounted) setProfile(profileData)
            } else {
                if (isMounted) setProfile(null)
            }

            if (isMounted) setLoading(false)
        })

        return () => {
            isMounted = false
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
