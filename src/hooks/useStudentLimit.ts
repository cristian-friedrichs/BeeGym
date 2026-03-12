import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { useSubscription } from './useSubscription'

export function useStudentLimit() {
    const { organizationId } = useAuth()
    const { maxStudents } = useSubscription()
    const [activeCount, setActiveCount] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!organizationId) {
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchActiveStudents = async () => {
            if (!isMounted) return
            setLoading(true)
            try {
                const { count, error } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .eq('status', 'ACTIVE')

                if (error) {
                    console.error('[useStudentLimit] Erro ao buscar alunos:', error)
                }

                if (!isMounted) return

                if (!error && count !== null) {
                    setActiveCount(count)
                }
            } catch (error) {
                if (isMounted) {
                    console.error('[useStudentLimit] Erro fatal no fetch:', error)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchActiveStudents()

        return () => {
            isMounted = false
        }
    }, [organizationId])

    const isUnlimited = maxStudents === null
    const hasReachedLimit = !isUnlimited && activeCount >= (maxStudents as number)
    const remainingSlots = isUnlimited ? Infinity : Math.max(0, (maxStudents as number) - activeCount)
    const canAddStudent = isUnlimited || activeCount < (maxStudents as number)

    return {
        activeCount,
        maxStudents,
        isUnlimited,
        hasReachedLimit,
        remainingSlots,
        canAddStudent,
        loading
    }
}
