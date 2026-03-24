import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env-config';

export async function getAuthenticatedUser(request: NextRequest) {
    const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return null;
    }

    return user;
}

export async function requireAdmin(request: NextRequest): Promise<{ error: NextResponse } | { user: { id: string; email: string; role: string; organization_id: string } }> {
    const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 }) };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { error: NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }) };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single();

    const userRole = (profile?.role || '').toUpperCase().trim();
    const isMasterEmail = user.email?.toLowerCase() === 'cristian_friedrichs@live.com';
    const isAdminUser = userRole === 'BEEGYM_ADMIN' || isMasterEmail;

    if (!isAdminUser) {
        return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
    }

    return {
        user: {
            id: user.id,
            email: user.email!,
            role: profile?.role || '',
            organization_id: profile?.organization_id || ''
        }
    };
}

export function logSecurityEvent(event: string, details: {
    userId?: string;
    ip?: string;
    path?: string;
    action?: string;
}) {
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY] ${timestamp} - ${event}`, {
        ...details,
        userAgent: details.userId ? undefined : 'unknown'
    });
}
