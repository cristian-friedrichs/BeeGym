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
            global: {
                fetch: (url: Parameters<typeof fetch>[0], options: Parameters<typeof fetch>[1]) => {
                    return fetch(url, { ...options, cache: 'no-store' });
                }
            },
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

    // Base routes
    const isAppAuthPage = url.pathname.startsWith('/login') ||
        url.pathname.startsWith('/register') ||
        url.pathname.startsWith('/signup')

    const isAdminAuthPage = url.pathname.startsWith('/admin/login')

    const isPublicRoute = url.pathname.startsWith('/api/webhook') ||
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/favicon') ||
        url.pathname.includes('.')

    const isAppRoute = url.pathname.startsWith('/app')
    const isAdminRoute = url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')
    // Redirecionar /app vazio para o dashboard/login correto
    if (url.pathname === '/app') {
        url.pathname = session ? '/app/painel' : '/login'
        return NextResponse.redirect(url)
    }

    // Se é pública, libera direto
    if (isPublicRoute) {
        return response
    }

    // Lógica para usuários NÃO AUTENTICADOS
    if (!session) {
        // Tentando acessar APP protegido
        if (isAppRoute && !isAppAuthPage && !url.pathname.startsWith('/api/')) {
            url.pathname = '/login'
            url.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        // Tentando acessar ADMIN protegido
        if (isAdminRoute && !isAdminAuthPage && !url.pathname.startsWith('/api/')) {
            url.pathname = '/admin/login'
            url.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        return response
    }

    // LÓGICA LOGADO: Validar Perfil e Organização
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, status, role')
        .eq('id', session.user.id)
        .single()

    // Fetch organization separately (no FK relationship in schema)
    let org: any = null
    if (profile?.organization_id) {
        const { data: orgData } = await supabase
            .from('organizations')
            .select('subscription_status, onboarding_completed')
            .eq('id', profile.organization_id)
            .single()
        org = orgData
    }

    // 👑 SEGREGAÇÃO DE SISTEMAS: ADMIN VS SAAS
    const isMasterEmail = session.user.email?.toLowerCase() === 'cristian_friedrichs@live.com'
    const userRole = (profile?.role || '').toUpperCase().trim();
    const isAdminUser = userRole === 'BEEGYM_ADMIN' || isMasterEmail;

    // LÓGICA PARA ADMINS
    if (isAdminUser) {
        // Admin acessando rotas de login (SaaS ou Admin)
        if (isAdminAuthPage) {
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }

        if (isAppAuthPage) {
            // Se o admin acessar o login do app, joga para o painel do app
            url.pathname = '/app/painel'
            return NextResponse.redirect(url)
        }

        // Pode transitar livremente por rotas do admin e do app (se ele também tiver um plano ou quiser testar)
        return response
    }

    // LÓGICA PARA USUÁRIOS SAAS (NÃO ADMIN)
    if (!isAdminUser) {
        // Se SaaS tentar acessar QUALQUER rota Admin -> Joga pro app/painel
        if (isAdminRoute || isAdminAuthPage) {
            if (url.pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Acesso negado: Requer privilégios de administrador.' }, { status: 403 })
            }
            url.pathname = '/app/painel'
            return NextResponse.redirect(url)
        }

        const activeStatuses = ['active', 'pago', 'status_ativo', 'ativo'];
        const currentStatus = (org?.subscription_status || '').toLowerCase().trim();
        const hasActiveSubscription = activeStatuses.includes(currentStatus);

        const isAccountActive = org?.onboarding_completed && hasActiveSubscription
        const isOnboardingPath = url.pathname.startsWith('/app/onboarding') || url.pathname.startsWith('/api/onboarding')
        
        // 🚨 Hard Paywall: Se tem onboarding mas não está ativo, joga para pending-activation
        if (org?.onboarding_completed && !hasActiveSubscription && isAppRoute && !isOnboardingPath && !url.pathname.startsWith('/app/pending-activation')) {
            url.pathname = '/app/pending-activation'
            return NextResponse.redirect(url)
        }

        // 🟢 SaaS em página de Login (e já está logado)
        if (isAppAuthPage) {
            if (isAccountActive || isAdminUser) {
                const redirect = request.nextUrl.searchParams.get('redirect')
                if (redirect && redirect !== '/') {
                    return NextResponse.redirect(new URL(redirect, request.url))
                }
                return NextResponse.redirect(new URL('/app/painel', request.url))
            }
            // Onboarding completo mas pagamento pendente → vai para pending-activation para verificar
            if (org?.onboarding_completed && !hasActiveSubscription) {
                return NextResponse.redirect(new URL('/app/pending-activation', request.url))
            }
            // Onboarding incompleto → vai iniciar o onboarding
            if (profile?.organization_id && !org?.onboarding_completed) {
                return NextResponse.redirect(new URL('/app/onboarding/step-3', request.url))
            }
            // Sem organização → passo 1 do onboarding
            if (!profile?.organization_id) {
                return NextResponse.redirect(new URL('/app/onboarding', request.url))
            }
        }

        // 🔴 Conta inativa tentando acessar rotas do App protegidas
        // ADMINS NUNCA são bloqueados aqui
        if (!isAdminUser && !isAccountActive && isAppRoute && !isOnboardingPath && !url.pathname.startsWith('/app/pending-activation')) {
            if (org?.subscription_status && !activeStatuses.includes(currentStatus)) {
                url.pathname = '/app/onboarding/pagamento'
            } else if (profile?.organization_id && !org?.onboarding_completed) {
                url.pathname = '/app/onboarding/step-3'
            } else {
                url.pathname = '/app/onboarding'
            }
            return NextResponse.redirect(url)
        }

        // 🔵 Ativo tentando entrar no Onboarding (Admins também voltam pro painel se tentarem entrar no onboarding)
        if ((isAccountActive || isAdminUser) && isOnboardingPath) {
            url.pathname = '/app/painel'
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
