/**
 * Tenant guard helpers for server actions.
 *
 * Every mutating action that targets a row by ID (rooms, units, plans, etc.)
 * must verify that the row belongs to the caller's organization BEFORE mutating.
 * RLS provides defense-in-depth at the DB layer, but the app layer must not
 * trust IDs coming from the client.
 */

import { createClient } from '@/lib/supabase/server';

export interface CallerContext {
    userId: string;
    organizationId: string;
    role: string | null;
}

/**
 * Returns the authenticated caller's user id, organization id and role.
 * Throws on unauthenticated or org-less profiles. Always use this at the top
 * of a mutating server action to anchor subsequent ownership checks.
 */
export async function getCallerContext(): Promise<CallerContext> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

    if (error || !profile?.organization_id) {
        throw new Error('Organização do usuário não encontrada');
    }

    return {
        userId: user.id,
        organizationId: profile.organization_id,
        role: (profile as any).role ?? null,
    };
}

/**
 * Verifies that a row in `table` with `id` belongs to `organizationId`.
 * Returns true if the caller's org owns the row; false otherwise (including
 * row-not-found, which we treat the same as forbidden to avoid enumeration).
 */
export async function assertRowBelongsToOrg(
    table: string,
    id: string,
    organizationId: string,
): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
        .from(table)
        .select('organization_id')
        .eq('id', id)
        .maybeSingle();

    if (error || !data) return false;
    return data.organization_id === organizationId;
}
