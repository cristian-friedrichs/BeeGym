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

    const fetchProfile = async (userId: string, attempt = 0): Promise<UserProfile | null> => {
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('id, full_name, email, role, organization_id, avatar_url, status')
                .eq('id', userId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') return null
                throw error
            }

            return data as UserProfile
        } catch (error: any) {
            const isAbort =
                error.name === 'AbortError' ||
                error instanceof DOMException ||
                error.message?.includes('Lock broken') ||
                error.message?.includes('aborted') ||
                error.message?.includes('AbortError')

            // Retry up to 3 times on lock/abort — auth lock contention is transient
            if (isAbort && attempt < 3) {
                await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
                return fetchProfile(userId, attempt + 1)
            }

            if (!isAbort && error.code !== 'PGRST116') {
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

        // Safety net: force unblock after 15s if everything fails
        const safetyTimeout = setTimeout(() => {
            if (isMounted) {
                console.warn('[AuthContext] Safety timeout triggered — forcing loading=false')
                setLoading(false)
            }
        }, 15000)

        // onAuthStateChange is the single source of truth.
        // It fires INITIAL_SESSION on first load (including after PKCE code exchange),
        // SIGNED_IN on login, SIGNED_OUT on logout, TOKEN_REFRESHED, etc.
        // We do NOT call getSession() separately to avoid race conditions with PKCE.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return

            try {
                if (session?.user) {
                    setUser(session.user)
                    const profileData = await fetchProfile(session.user.id)
                    if (isMounted) setProfile(profileData)
                } else {
                    setUser(null)
                    setProfile(null)
                }
            } catch (e: any) {
                const isAbort = e.name === 'AbortError' || e.message?.includes('Lock broken')
                if (!isAbort) console.error('[AuthContext] onAuthStateChange error:', e.message)
            } finally {
                // Mark loading done after INITIAL_SESSION or any definitive event
                if (isMounted && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
                    clearTimeout(safetyTimeout)
                    setLoading(false)
                }
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
