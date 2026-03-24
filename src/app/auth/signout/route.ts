import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env-config'

export async function GET(request: Request) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: any[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    // Check if a session exists before trying to sign out
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (session) {
        await supabase.auth.signOut()
    }

    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/login`, {
        status: 302,
    })
}
