'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export type AuthStatus =
    | 'checking_auth'
    | 'unauthenticated'
    | 'checking_profile'
    | 'profile_found'
    | 'profile_missing'
    | 'auth_error'
    | 'profile_error'

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
    authStatus: AuthStatus
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
    retryAuth: () => void
    isAdmin: boolean
    isInstructor: boolean
    organizationId: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [authStatus, setAuthStatus] = useState<AuthStatus>('checking_auth')
    const router = useRouter()
    const isFetchingProfile = useRef(false)
    const lastProfileUserId = useRef<string | null>(null)
    const isMounted = useRef(true)
    const [retryCounter, setRetryCounter] = useState(0)

    const fetchProfile = async (userId: string, attempt = 0): Promise<{ data: UserProfile | null; error: Error | null }> => {
        try {
            // Promise de timeout de 10 segundos
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout fetching profile')), 10000)
            )

            const fetchPromise = (supabase as any)
                .from('profiles')
                .select('id, full_name, email, role, organization_id, avatar_url, status')
                .eq('id', userId)
                .maybeSingle()

            const result = await Promise.race([fetchPromise, timeoutPromise]) as any
            const { data, error } = result

            if (error) {
                console.error('[Profile] error:', error.message || error)
                return { data: null, error: new Error(error.message || 'Profile fetch error') }
            }

            return { data: data as UserProfile | null, error: null }
        } catch (error: any) {
            const isAbort =
                error.name === 'AbortError' ||
                error instanceof DOMException ||
                error.message?.includes('Lock broken') ||
                error.message?.includes('aborted') ||
                error.message?.includes('AbortError') ||
                error.message?.includes('Timeout')

            // Retry up to 3 times on lock/abort/timeout — auth lock contention is transient
            if (isAbort && attempt < 3) {
                console.warn(`[Profile] fetch failed (attempt ${attempt + 1}), retrying in ${300 * (attempt + 1)}ms...`, error.message)
                await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
                return fetchProfile(userId, attempt + 1)
            }

            if (!isAbort) {
                console.error('[Profile] error:', error.message || error)
            }
            return { data: null, error }
        }
    }

    const loadProfile = useCallback(async (targetUser: User) => {
        if (isFetchingProfile.current) return
        isFetchingProfile.current = true

        try {
            if (lastProfileUserId.current === targetUser.id) {
                console.log('[Profile] already loaded for user:', targetUser.id)
                if (isMounted.current) setAuthStatus('profile_found')
                return
            }

            if (isMounted.current) setAuthStatus('checking_profile')
            console.log('[Profile] loading profile')

            const { data: profileData, error } = await fetchProfile(targetUser.id)

            if (!isMounted.current) return

            if (error) {
                console.error('[Profile] error loading profile')
                setProfile(null)
                lastProfileUserId.current = null
                setAuthStatus('profile_error')
            } else if (profileData) {
                console.log('[Profile] found')
                setProfile(profileData)
                lastProfileUserId.current = targetUser.id
                setAuthStatus('profile_found')
            } else {
                console.log('[Profile] missing')
                setProfile(null)
                lastProfileUserId.current = null
                setAuthStatus('profile_missing')
            }
        } finally {
            isFetchingProfile.current = false
        }
    }, [])

    const refreshProfile = useCallback(async () => {
        if (user) {
            lastProfileUserId.current = null // force re-fetch
            isFetchingProfile.current = false // allow re-fetch
            await loadProfile(user)
        }
    }, [user, loadProfile])

    const retryAuth = useCallback(() => {
        setAuthStatus('checking_auth')
        setUser(null)
        setProfile(null)
        lastProfileUserId.current = null
        isFetchingProfile.current = false
        setRetryCounter(c => c + 1)
    }, [])

    useEffect(() => {
        isMounted.current = true

        console.log('[Auth] setting up auth listener')

        // Listener for all auth events. Supabase triggers this immediately upon subscribing.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted.current) return

            console.log(`[Auth] state change: ${event}`)

            try {
                if (session?.user) {
                    console.log(`[Auth] user found (event: ${event})`)
                    setUser(session.user)
                    await loadProfile(session.user)
                } else {
                    console.log(`[Auth] no user (event: ${event})`)
                    setUser(null)
                    setProfile(null)
                    lastProfileUserId.current = null
                    setAuthStatus('unauthenticated')
                }
            } catch (e: any) {
                const isAbort = e.name === 'AbortError' || e.message?.includes('Lock broken')
                if (!isAbort) {
                    console.error('[Auth] state change error:', e.message)
                }
            }
        })

        return () => {
            isMounted.current = false
            subscription.unsubscribe()
        }
    }, [retryCounter, loadProfile])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setAuthStatus('unauthenticated')
        router.push('/login')
    }

    // Backward-compatible loading: true while in any "checking" state
    const loading = authStatus === 'checking_auth' || authStatus === 'checking_profile'

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                authStatus,
                signOut,
                refreshProfile,
                retryAuth,
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
