import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { useSubscription } from './useSubscription'

export function useStudentLimit() {
    const { organizationId } = useAuth()
    const { plan } = useSubscription()
    const [activeCount, setActiveCount] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organizationId) {
            setLoading(false)
            return
        }

        const fetchActiveStudents = async () => {
            setLoading(true)
            try {
                const { count, error } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .eq('status', 'ACTIVE')

                if (!error && count !== null) {
                    setActiveCount(count)
                }
            } catch (error) {
                console.error('Failed to fetch active students:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchActiveStudents()
    }, [organizationId])

    const maxStudents = plan.max_students
    const isUnlimited = maxStudents === null
    const hasReachedLimit = !isUnlimited && activeCount >= (maxStudents as number)

    return {
        activeCount,
        maxStudents,
        isUnlimited,
        hasReachedLimit,
        loading
    }
}
