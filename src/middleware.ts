import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: any[]) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 🔒 Verificar sessão
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const url = request.nextUrl.clone()
    const isAuthPage = url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/register') ||
        url.pathname.startsWith('/signup')

    const isPublicRoute = url.pathname.startsWith('/api/webhook') ||
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/favicon') ||
        url.pathname.includes('.')

    const isProtectedRoute = !isAuthPage && !isPublicRoute

    // 1. Redirecionar não autenticados
    if (!session) {
        if (isProtectedRoute) {
            url.pathname = '/login'
            url.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }
        return response
    }

    // 2. LOGADO: Validar Perfil e Organização (apenas se não for rota de asset pública)
    if (!isPublicRoute) {
        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                organization_id, 
                status,
                role,
                organizations (
                    subscription_status,
                    onboarding_completed
                )
            `)
            .eq('id', session.user.id)
            .single()

        // 👑 SEGREGAÇÃO DE SISTEMAS: ADMIN VS SAAS
        // Define o usuário como Admin se ele tiver a role no banco OU for o e-mail Master do sistema
        const isMasterEmail = session.user.email === 'cristian_friedrichs@live.com'
        const isAdminUser = profile?.role === 'BEEGYM_ADMIN' || isMasterEmail
        const isAdminRoute = url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')

        // 👑 1. ROTEAMENTO EXCLUSIVO PARA ROTA /ADMIN
        if (isAdminRoute) {
            if (!isAdminUser) {
                // Usuário comum tentando acessar o admin -> Volta pro painel
                if (url.pathname.startsWith('/api/')) {
                    return NextResponse.json({ error: 'Acesso negado: Requer privilégios de administrador.' }, { status: 403 })
                }
                url.pathname = '/painel'
                return NextResponse.redirect(url)
            }
            return response // Admin acessando admin = OK
        }

        // 👑 2. ROTEAMENTO EXCLUSIVO PARA USUÁRIO ADMIN 
        if (isAdminUser) {
            // Se o admin logado tentar acessar rotas SaaS ou a raiz, mandar para o /admin
            if (isAuthPage || url.pathname === '/' || url.pathname.startsWith('/painel') || url.pathname.startsWith('/onboarding')) {
                url.pathname = '/admin'
                return NextResponse.redirect(url)
            }
            return response // Libera outras rotas (ex: APIs) caso não tenham sido barradas
        }

        // 🏢 3. ROTEAMENTO EXCLUSIVO PARA CLIENTES SAAS
        // Chega aqui apenas clientes SaaS em rotas do SaaS
        const org = profile?.organizations as any
        const hasActiveSubscription = org?.subscription_status === 'active' || org?.subscription_status === 'trial'
        const isAccountActive = org?.onboarding_completed && hasActiveSubscription
        const isOnboardingPath = url.pathname.startsWith('/onboarding') || url.pathname.startsWith('/api/onboarding')

        // 🟢 CASO SaaS 1: Página de Login/Register
        if (isAuthPage) {
            if (isAccountActive) {
                const redirect = request.nextUrl.searchParams.get('redirect')
                if (redirect && redirect !== '/') {
                    return NextResponse.redirect(new URL(redirect, request.url))
                }
                return NextResponse.redirect(new URL('/painel', request.url))
            }
            return response // Deixa logado no login se não for ativo
        }

        // 🔴 CASO SaaS 2: Rota Protegida (Raiz / ou Painel) mas conta Inapta
        if (!isAccountActive && !isOnboardingPath && !url.pathname.startsWith('/pending-activation')) {
            if (org?.subscription_status && org?.subscription_status !== 'active' && org?.subscription_status !== 'trial') {
                url.pathname = '/onboarding/pagamento'
            } else if (profile?.organization_id && !org?.onboarding_completed) {
                url.pathname = '/onboarding/step-3'
            } else {
                url.pathname = '/onboarding'
            }
            return NextResponse.redirect(url)
        }

        // 🔵 CASO SaaS 3: Ativo tentando entrar no Onboarding via URL
        if (isAccountActive && isOnboardingPath) {
            url.pathname = '/painel'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
