'use server'

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/auth/role-checks';
import { KIWIFY_TOKEN } from '@/lib/env-config';

/**
 * Server-only gate. Returns null on success, error message on failure.
 * Server actions don't have NextRequest, so we use the SSR client directly.
 */
async function ensureSuperAdmin(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return 'Unauthorized: not signed in';

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!isSuperAdmin((profile as any)?.role)) {
        return 'Forbidden: SUPER_ADMIN required';
    }
    return null;
}

export async function getWebhookLogs() {
    const gateError = await ensureSuperAdmin();
    if (gateError) return { success: false, data: [], error: gateError };

    try {
        const { data, error } = await supabaseAdmin
            .from('webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[Admin] Erro ao buscar logs de webhook:', error);
            return { success: false, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('[Admin] Erro fatal ao buscar logs:', err.message);
        return { success: false, data: [] };
    }
}

export async function getValidWebhookEmails() {
    const gateError = await ensureSuperAdmin();
    if (gateError) return { success: false, data: [], error: gateError };

    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .not('email', 'is', null)
            .order('email');

        if (error) {
            console.error('[Admin] Erro ao buscar emails válidos:', error);
            return { success: false, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (err: any) {
        console.error('[Admin] Erro fatal ao buscar emails:', err.message);
        return { success: false, data: [] };
    }
}

/**
 * Returns the public webhook URL the user should paste into Kiwify.
 * Includes the token as a query-string param (Kiwify only supports query auth).
 */
export async function getKiwifyWebhookConfig() {
    const gateError = await ensureSuperAdmin();
    if (gateError) return { success: false, error: gateError } as const;

    const h = await headers();
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const baseUrl = `${proto}://${host}`;

    const tokenConfigured = Boolean(KIWIFY_TOKEN);
    // We only return a masked preview of the token; the full URL with token is
    // built server-side and returned once for the admin to copy.
    const url = tokenConfigured
        ? `${baseUrl}/api/webhooks/kiwify?token=${encodeURIComponent(KIWIFY_TOKEN)}`
        : `${baseUrl}/api/webhooks/kiwify`;

    const tokenMasked = tokenConfigured
        ? `${KIWIFY_TOKEN.slice(0, 4)}…${KIWIFY_TOKEN.slice(-4)}`
        : '(não configurado)';

    return {
        success: true as const,
        baseUrl: `${baseUrl}/api/webhooks/kiwify`,
        url,
        tokenConfigured,
        tokenMasked,
    };
}

type SimulateInput = {
    email: string;
    produto: string;
    evento:
        | 'assinatura aprovada'
        | 'assinatura renovada'
        | 'assinatura cancelada'
        | 'assinatura atrasada'
        | 'compra aprovada'
        | 'reembolso'
        | 'chargeback';
};

/**
 * Server-side simulation: builds the simple-format payload, signs it with the
 * server-side KIWIFY_TOKEN (never sent to the browser), and POSTs to our own
 * webhook endpoint. Returns the handler response.
 */
export async function simulateKiwifyWebhook(input: SimulateInput) {
    const gateError = await ensureSuperAdmin();
    if (gateError) return { success: false, error: gateError } as const;

    if (!input.email) {
        return { success: false, error: 'E-mail é obrigatório' } as const;
    }
    if (!KIWIFY_TOKEN) {
        return { success: false, error: 'KIWIFY_TOKEN não configurado no servidor' } as const;
    }

    const h = await headers();
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const baseUrl = `${proto}://${host}`;

    const payload = {
        email: input.email,
        evento: input.evento,
        produto: input.produto,
        token: KIWIFY_TOKEN,
    };

    try {
        const res = await fetch(`${baseUrl}/api/webhooks/kiwify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            cache: 'no-store',
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return { success: false, error: data?.error || `HTTP ${res.status}`, status: res.status, data } as const;
        }

        return { success: true, status: res.status, data } as const;
    } catch (err: any) {
        return { success: false, error: err?.message || 'Falha de rede ao chamar webhook' } as const;
    }
}
