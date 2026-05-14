// Thin re-export over SubscriptionContext.
// The hook used to fetch its own data; now it just reads from the shared provider
// so that all consumers in the tree share a single fetch + single state.
//
// API is unchanged — every existing call site continues to work.
import { useSubscriptionContext } from '@/context/SubscriptionContext'

export function useSubscription() {
    return useSubscriptionContext()
}
