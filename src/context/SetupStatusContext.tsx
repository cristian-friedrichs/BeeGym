'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { isSuperAdmin } from '@/lib/auth/role-checks';

export interface SetupStatus {
    hasUnit: boolean;
    hasInstructor: boolean;
    hasPlan: boolean;
    hasStudent: boolean;
    isPrimaryReady: boolean;  // unit + instructor + plan
    isFullyReady: boolean;    // primary + student
    loading: boolean;
    isSuperAdminUser: boolean;
    refresh: () => Promise<void>;
}

const defaultStatus: SetupStatus = {
    isSuperAdminUser: false,
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

export function SetupStatusProvider({ children }: { children: ReactNode }) {
    const { organizationId, profile, loading: authLoading } = useAuth();
    const [hasUnit, setHasUnit] = useState(false);
    const [hasInstructor, setHasInstructor] = useState(false);
    const [hasPlan, setHasPlan] = useState(false);
    const [hasStudent, setHasStudent] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [unitsRes, instructorsRes, plansRes, studentsRes] = await Promise.all([
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
                    .from('plans')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .eq('active', true),
                (supabase as any)
                    .from('students')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId),
            ]);

            setHasUnit((unitsRes.count ?? 0) > 0);
            setHasInstructor((instructorsRes.count ?? 0) > 0);
            setHasPlan((plansRes.count ?? 0) > 0);
            setHasStudent((studentsRes.count ?? 0) > 0);
        } catch (err) {
            console.error('[SetupStatus] Error fetching setup status:', err);
        } finally {
            setLoading(false);
        }
    }, [organizationId, profile?.role]);

    useEffect(() => {
        if (authLoading) return;
        fetchStatus();
    }, [authLoading, fetchStatus]);

    const isSuperAdminUser = isSuperAdmin(profile?.role as string | undefined);

    const value = useMemo<SetupStatus>(() => {
        const isPrimaryReady = hasUnit && hasInstructor && hasPlan;
        return {
            hasUnit,
            hasInstructor,
            hasPlan,
            hasStudent,
            isPrimaryReady,
            isFullyReady: isPrimaryReady && hasStudent,
            loading,
            isSuperAdminUser,
            refresh: fetchStatus,
        };
    }, [hasUnit, hasInstructor, hasPlan, hasStudent, loading, isSuperAdminUser, fetchStatus]);

    return (
        <SetupStatusContext.Provider value={value}>
            {children}
        </SetupStatusContext.Provider>
    );
}

export function useSetupStatus() {
    return useContext(SetupStatusContext);
}
