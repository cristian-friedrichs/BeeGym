'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

interface PendingWorkout {
  id: string
  title: string
  start_datetime: string
}

interface PendingWorkoutContextType {
  pendingCount: number
  pendingList: PendingWorkout[]
  isModalDismissed: boolean
  dismissModal: () => void
  fetchPendingWorkouts: () => Promise<void>
}

const PendingWorkoutContext = createContext<PendingWorkoutContextType | undefined>(undefined)

export function PendingWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [pendingList, setPendingList] = useState<PendingWorkout[]>([])
  const [isModalDismissed, setIsModalDismissed] = useState(false)
  const { organizationId, loading: authLoading } = useAuth()
  const supabase = createClient()

  const fetchPendingWorkouts = async () => {
    if (!organizationId) {
      setPendingList([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('vw_calendar_events_active')
        .select('id, title, start_datetime')
        .eq('organization_id', organizationId)
        .eq('computed_status', 'Pendente')
        .order('start_datetime', { ascending: true })

      if (error) {
        console.error('[PendingWorkoutContext] Error fetching pending workouts:', error)
      } else {
        setPendingList(data || [])
      }
    } catch (err) {
      console.error('[PendingWorkoutContext] Error in fetch:', err)
    }
  }

  useEffect(() => {
    if (authLoading || !organizationId) return

    fetchPendingWorkouts()

    // Realtime subscription on calendar_events table
    const channel = supabase
      .channel('pending-workouts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `organization_id=eq.${organizationId}`
        },
        () => {
          fetchPendingWorkouts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, authLoading])

  return (
    <PendingWorkoutContext.Provider
      value={{
        pendingCount: pendingList.length,
        pendingList,
        isModalDismissed,
        dismissModal: () => setIsModalDismissed(true),
        fetchPendingWorkouts
      }}
    >
      {children}
    </PendingWorkoutContext.Provider>
  )
}

export function usePendingWorkouts() {
  const context = useContext(PendingWorkoutContext)
  if (!context) {
    throw new Error('usePendingWorkouts must be used within a PendingWorkoutProvider')
  }
  return context
}
