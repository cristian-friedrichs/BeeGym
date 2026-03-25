'use client';

import { useSubscription } from './useSubscription';
import type { PlanFeature } from '@/config/plans';

/**
 * Hook to verify if the organization's current plan allows a specific feature.
 * 
 * @param feature The feature to check
 * @returns boolean indicating if the feature is allowed
 */
export function useFeatureGate(feature: PlanFeature): boolean {
    const { hasFeature, loading } = useSubscription();
    
    // During loading, we assume false to prevent rendering restricted content (optimistic locking)
    if (loading) return false;
    
    return hasFeature(feature);
}

/**
 * Hook to verify multiple features (AND logic - requires all)
 */
export function useFeatureGateAll(features: PlanFeature[]): boolean {
    const { hasFeature, loading } = useSubscription();
    if (loading) return false;
    return features.every(f => hasFeature(f));
}

/**
 * Hook to verify multiple features (OR logic - requires any)
 */
export function useFeatureGateAny(features: PlanFeature[]): boolean {
    const { hasFeature, loading } = useSubscription();
    if (loading) return false;
    return features.some(f => hasFeature(f));
}
