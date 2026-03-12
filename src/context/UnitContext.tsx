'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UnitContextType {
    currentUnitId: string | null;
    setCurrentUnitId: (id: string | null) => void;
    isLoading: boolean;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
    const [currentUnitId, setCurrentUnitIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function initializeUnit() {
            try {
                // Get authenticated user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }
                // Get user's organization and name
                const { data: userData, error: userError } = await (supabase as any)
                    .from('profiles')
                    .select('organization_id, full_name')
                    .eq('id', user.id)
                    .single();

                if (userError) {
                    console.error('[UnitContext] Error fetching user data:', JSON.stringify(userError, null, 2));
                }

                if (!userData?.organization_id) {
                    setIsLoading(false);
                    return;
                }
                // Fetch units for this organization
                let { data: units, error: unitsError } = await (supabase as any)
                    .from('units')
                    .select('*')
                    .eq('organization_id', userData.organization_id);

                if (unitsError) {
                    console.error('[UnitContext] Error fetching units:', unitsError);
                }

                // Fetch organization to use as Master Unit
                const { data: orgData } = await (supabase as any)
                    .from('organizations')
                    .select('id, name')
                    .eq('id', userData.organization_id)
                    .single();

                const masterUnit = {
                    id: userData.organization_id,
                    name: orgData?.name || ('Personal ' + (userData.full_name || 'User')),
                    active: true,
                    is_master: true
                };

                // Combine Master Unit with branches
                units = [masterUnit, ...(units || [])];

                // FORCE AUTO-SELECTION LOGIC
                let selectedUnitId: string | null = null;

                // Check if there's already a stored unit ID
                const storedUnitId = localStorage.getItem('currentUnitId');
                // Verify if stored ID is valid in the current units list
                const storedUnitExists = storedUnitId ? units!.some((u: any) => u.id === storedUnitId) : false;

                if (storedUnitId && storedUnitExists) {
                    // Use stored unit if it still exists
                    selectedUnitId = storedUnitId;
                } else {
                    // Auto-select the first unit (prioritize active ones if available)
                    const activeUnit = units!.find((u: any) => u.active === true);
                    const firstUnit = units![0];

                    selectedUnitId = activeUnit ? activeUnit.id : firstUnit.id;
                    // FORCED PERSISTENCE
                    if (selectedUnitId) {
                        localStorage.setItem('currentUnitId', selectedUnitId);
                    }
                }

                // SET THE STATE
                if (selectedUnitId) {
                    setCurrentUnitIdState(selectedUnitId);
                }

                // Store units data for Header display
                localStorage.setItem('units_data', JSON.stringify(units));
            } catch (err) {
                console.error('[UnitContext] ❌ Fatal error during initialization:', err);
            } finally {
                setIsLoading(false);
            }
        }

        initializeUnit();
    }, []);

    const setCurrentUnitId = (id: string | null) => {
        setCurrentUnitIdState(id);
        if (id) {
            localStorage.setItem('currentUnitId', id);
        } else {
            localStorage.removeItem('currentUnitId');
        }
        // Dispatch custom event for components that aren't using context
        window.dispatchEvent(new Event('storage-update'));
    };

    return (
        <UnitContext.Provider value={{ currentUnitId, setCurrentUnitId, isLoading }}>
            {children}
        </UnitContext.Provider>
    );
}

export function useUnit() {
    const context = useContext(UnitContext);
    if (context === undefined) {
        throw new Error('useUnit must be used within a UnitProvider');
    }
    return context;
}
