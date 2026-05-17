'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

type Filter = { column: string; value: any };

interface UseOrgListOptions {
    /** Table to query. */
    table: string;
    /** Columns to select. Defaults to '*'. */
    select?: string;
    /** Extra filters applied to the query. */
    filters?: Filter[];
    /** Column to order by ascending. */
    orderBy?: string;
    /** Set false to skip fetching (e.g. modal not open). */
    enabled?: boolean;
}

/**
 * Fetches a list of rows scoped to the current user's organization.
 *
 * Handles the most common bug pattern in this codebase: modals that try to
 * load dropdown data before `organizationId` is available from AuthContext.
 *
 * Re-fetches automatically when `organizationId`, `enabled`, or `JSON.stringify(filters)` changes.
 */
export function useOrgList<T = any>({ table, select = '*', filters = [], orderBy, enabled = true }: UseOrgListOptions) {
    const { organizationId } = useAuth();
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filtersKey = JSON.stringify(filters);

    useEffect(() => {
        if (!enabled || !organizationId) return;

        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const supabase = createClient();
                let query: any = (supabase as any).from(table).select(select).eq('organization_id', organizationId);
                for (const f of filters) {
                    query = query.eq(f.column, f.value);
                }
                if (orderBy) query = query.order(orderBy);
                const { data: rows, error: err } = await query;
                if (cancelled) return;
                if (err) {
                    console.error(`[useOrgList:${table}]`, err);
                    setError(err.message);
                    setData([]);
                } else {
                    setData((rows as T[]) ?? []);
                }
            } catch (e: any) {
                if (cancelled) return;
                console.error(`[useOrgList:${table}] threw`, e);
                setError(e?.message ?? 'Erro ao carregar dados');
                setData([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();

        return () => { cancelled = true; };
    }, [organizationId, enabled, table, select, orderBy, filtersKey]);

    return { data, loading, error };
}
