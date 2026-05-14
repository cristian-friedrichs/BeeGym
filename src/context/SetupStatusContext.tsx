'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { isSuperAdmin } from '@/lib/auth/role-checks';

export interface SetupStatus {
    hasBusinessData: boolean; // business_type + name + at least one active schedule day
    hasUnit: boolean;
    hasInstructor: boolean;
    hasPlan: boolean;
    hasStudent: boolean;
    isPrimaryReady: boolean;  // businessData + unit + instructor + plan
    isFullyReady: boolean;    // primary + student
    loading: boolean;
    isSuperAdminUser: boolean;
    refresh: () => Promise<void>;
}

const defaultStatus: SetupStatus = {
    isSuperAdminUser: false,
    hasBusinessData: false,
    hasUnit: false,
    hasInstructor: false,
    hasPlan: false,
    hasStudent: false,
    isPrimaryReady: false,
    isFullyReady: false,
    loading: true,
    refresh: async () => {},
};

const SetupStatusContext = createContext<SetupStatus>(defaultStatus);

const SETUP_CACHE_KEY = (orgId: string) => `beegym_setup_complete:${orgId}`;

export function SetupStatusProvider({ children }: { children: ReactNode }) {
    const { organizationId, profile, loading: authLoading } = useAuth();
    const [hasBusinessData, setHasBusinessData] = useState(false);
    const [hasUnit, setHasUnit] = useState(false);
    const [hasInstructor, setHasInstructor] = useState(false);
    const [hasPlan, setHasPlan] = useState(false);
    const [hasStudent, setHasStudent] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async (opts?: { useCache?: boolean }) => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        // Fast path: only on initial mount (useCache=true). The `refresh()` exposed
        // to callers always bypasses cache so post-mutation refreshes are accurate.
        if (opts?.useCache && typeof window !== 'undefined' && window.localStorage.getItem(SETUP_CACHE_KEY(organizationId)) === '1') {
            setHasBusinessData(true);
            setHasUnit(true);
            setHasInstructor(true);
            setHasPlan(true);
            setHasStudent(true);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [orgRes, unitsRes, instructorsRes, plansRes, studentsRes] = await Promise.all([
                (supabase as any)
                    .from('organizations')
                    .select('business_type, name, schedule')
                    .eq('id', organizationId)
                    .single(),
                (supabase as any)
                    .from('units')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .eq('active', true),
                (supabase as any)
                    .from('instructors')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId),
                (supabase as any)
                    .from('membership_plans')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .eq('active', true),
                (supabase as any)
                    .from('students')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId),
            ]);

            const VALID_BUSINESS_TYPES = [
                'Personal Trainer', 'Academia', 'Box de CrossFit', 'Studio de Pilates',
                'Studio de Ioga', 'Studio de Dança', 'Escola de Esportes',
                'Escola de Artes Marciais & Lutas', 'Outros',
            ];
            const org = orgRes.data;
            const hasSchedule = org?.schedule
                ? Object.values(org.schedule as Record<string, { active?: boolean }>).some(d => d?.active)
                : false;
            const validBusinessType = !!(org?.business_type && VALID_BUSINESS_TYPES.includes(org.business_type));
            const businessData = !!(validBusinessType && org?.name && hasSchedule);
            const hasU = (unitsRes.count ?? 0) > 0;
            const hasI = (instructorsRes.count ?? 0) > 0;
            const hasP = (plansRes.count ?? 0) > 0;
            const hasS = (studentsRes.count ?? 0) > 0;

            setHasBusinessData(businessData);
            setHasUnit(hasU);
            setHasInstructor(hasI);
            setHasPlan(hasP);
            setHasStudent(hasS);

            // Persist completion so the next page load can skip these 5 queries.
            // Note: hasUnit isn't part of the wizard, so we don't include it here.
            if (typeof window !== 'undefined') {
                const isComplete = businessData && hasI && hasP && hasS;
                if (isComplete) {
                    window.localStorage.setItem(SETUP_CACHE_KEY(organizationId), '1');
                } else {
                    window.localStorage.removeItem(SETUP_CACHE_KEY(organizationId));
                }
            }
        } catch (err) {
            console.error('[SetupStatus] Error fetching setup status:', err);
        } finally {
            setLoading(false);
        }
    }, [organizationId, profile?.role]);

    useEffect(() => {
        if (authLoading) return;
        // Initial mount: try the cache to skip 5 parallel queries when setup is known complete.
        fetchStatus({ useCache: true });
    }, [authLoading, fetchStatus]);

    // Wrapper exposed as `refresh` to consumers — always bypasses the cache.
    const refresh = useCallback(() => fetchStatus(), [fetchStatus]);

    const isSuperAdminUser = isSuperAdmin(profile?.role as string | undefined);

    const value = useMemo<SetupStatus>(() => {
        // Wizard completes when: business data + plan + instructor + student
        // (units are optional — not part of the 4-step wizard)
        const isPrimaryReady = hasBusinessData && hasPlan && hasInstructor && hasStudent;
        return {
            hasBusinessData,
            hasUnit,
            hasInstructor,
            hasPlan,
            hasStudent,
            isPrimaryReady,
            isFullyReady: isPrimaryReady,
            loading,
            isSuperAdminUser,
            refresh,
        };
    }, [hasBusinessData, hasUnit, hasInstructor, hasPlan, hasStudent, loading, isSuperAdminUser, refresh]);

    return (
        <SetupStatusContext.Provider value={value}>
            {children}
        </SetupStatusContext.Provider>
    );
}

export function useSetupStatus() {
    return useContext(SetupStatusContext);
}
