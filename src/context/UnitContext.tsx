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
                console.log('[UnitContext] Starting initialization...');

                // Get authenticated user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('[UnitContext] No authenticated user found');
                    setIsLoading(false);
                    return;
                }
                console.log('[UnitContext] User authenticated:', user.id);

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
                    console.log('[UnitContext] No organization_id found for user');
                    setIsLoading(false);
                    return;
                }
                console.log('[UnitContext] Organization ID:', userData.organization_id);

                // Fetch units for this organization
                let { data: units, error: unitsError } = await (supabase as any)
                    .from('units')
                    .select('*')
                    .eq('organization_id', userData.organization_id);

                if (unitsError) {
                    console.error('[UnitContext] Error fetching units:', unitsError);
                }

                // --- FALLBACK AUTO-CURA LOGIC ---
                // If units list is empty but we have an organization ID, create a virtual fallback unit
                if (!units || units.length === 0) {
                    console.warn('[UnitContext] ⚠️ No units found in DB. Activating FALLBACK AUTO-CURA.');

                    const fallbackUnit: any = {
                        id: userData.organization_id, // Use Org ID as Unit ID for fallback
                        name: 'Personal ' + (userData.full_name || 'User'),
                        business_type: 'personal',
                        active: true,
                        organization_id: userData.organization_id,
                        address_json: null,
                        created_at: new Date().toISOString()
                    };

                    units = [fallbackUnit];
                    console.log('[UnitContext] 🛡️ Fallback unit created:', fallbackUnit);
                }
                // --------------------------------

                console.log('[UnitContext] Units to process:', units);

                // FORCE AUTO-SELECTION LOGIC
                console.log('[UnitContext] 🎯 Found', units!.length, 'unit(s). Auto-selecting...');

                let selectedUnitId: string | null = null;

                // Check if there's already a stored unit ID
                const storedUnitId = localStorage.getItem('currentUnitId');
                console.log('[UnitContext] Stored unit ID from localStorage:', storedUnitId);

                // Verify if stored ID is valid in the current units list
                const storedUnitExists = storedUnitId ? units!.some((u: any) => u.id === storedUnitId) : false;

                if (storedUnitId && storedUnitExists) {
                    // Use stored unit if it still exists
                    console.log('[UnitContext] ✅ Using stored unit:', storedUnitId);
                    selectedUnitId = storedUnitId;
                } else {
                    // Auto-select the first unit (prioritize active ones if available)
                    const activeUnit = units!.find((u: any) => u.active === true);
                    const firstUnit = units![0];

                    selectedUnitId = activeUnit ? activeUnit.id : firstUnit.id;
                    console.log('[UnitContext] ✅ Auto-selected unit:', selectedUnitId);

                    // FORCED PERSISTENCE
                    if (selectedUnitId) {
                        localStorage.setItem('currentUnitId', selectedUnitId);
                    }
                }

                // SET THE STATE
                if (selectedUnitId) {
                    console.log('[UnitContext] 🚀 Setting currentUnitId state to:', selectedUnitId);
                    setCurrentUnitIdState(selectedUnitId);
                }

                // Store units data for Header display
                localStorage.setItem('units_data', JSON.stringify(units));
                console.log('[UnitContext] ✅ Initialization complete. Active unit:', selectedUnitId);

            } catch (err) {
                console.error('[UnitContext] ❌ Fatal error during initialization:', err);
            } finally {
                setIsLoading(false);
            }
        }

        initializeUnit();
    }, []);

    const setCurrentUnitId = (id: string | null) => {
        console.log('[UnitContext] Manual unit change to:', id);
        setCurrentUnitIdState(id);
        if (id) {
            localStorage.setItem('currentUnitId', id);
        } else {
            localStorage.removeItem('currentUnitId');
        }
        // Dispatch custom event for components that aren't using context
        window.dispatchEvent(new Event('storage-update'));
    };

    console.log('[UnitContext] Render - currentUnitId:', currentUnitId, 'isLoading:', isLoading);

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
