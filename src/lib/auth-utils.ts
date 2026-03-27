import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}

export async function requireAdmin(request: NextRequest): Promise<{ error: NextResponse } | { user: { id: string; email: string; role: string; organization_id: string } }> {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return { error: NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 }) };
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
