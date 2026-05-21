'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePendingWorkouts } from '@/context/PendingWorkoutContext'
import { AlertTriangle, Calendar, Clock, Check, X, Loader2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Enrollment {
  id: string
  student_id: string
  status: string
  students: {
    id: string
    full_name: string
  } | null
}

interface PendingEventData {
  id: string
  title: string
  start_datetime: string
  enrollments: Enrollment[]
  loadingEnrollments: boolean
  evaluations: Record<string, 'CONFIRMED' | 'ABSENT'> // enrollmentId -> status
}

export function PendingWorkoutsModal() {
  const { pendingList, pendingCount, isModalDismissed, dismissModal, fetchPendingWorkouts } = usePendingWorkouts()
  const [eventsData, setEventsData] = useState<PendingEventData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeEventIndex, setActiveEventIndex] = useState(0)
  const supabase = createClient()

  // Fetch enrollments for each pending event
  useEffect(() => {
    if (pendingList.length === 0) {
      setEventsData([])
      return
    }

    const loadEnrollments = async () => {
      const data: PendingEventData[] = pendingList.map(event => ({
        id: event.id,
        title: event.title,
        start_datetime: event.start_datetime,
        enrollments: [],
        loadingEnrollments: true,
        evaluations: {}
      }))
      setEventsData(data)

      for (let i = 0; i < pendingList.length; i++) {
        const event = pendingList[i]
        try {
          const { data: res, error } = await supabase
            .from('event_enrollments' as any)
            .select(`
              id,
              student_id,
              status,
              students (
                id,
                full_name
              )
            `)
            .eq('event_id', event.id)

          if (error) throw error

          setEventsData(prev => prev.map(item => {
            if (item.id === event.id) {
              const enrolls = (res || []) as any[]
              // Initialize all enrollments to CONFIRMED by default
              const evals: Record<string, 'CONFIRMED' | 'ABSENT'> = {}
              enrolls.forEach(e => {
                evals[e.id] = (e.status === 'ABSENT' ? 'ABSENT' : 'CONFIRMED')
              })

              return {
                ...item,
                enrollments: enrolls,
                loadingEnrollments: false,
                evaluations: evals
              }
            }
            return item
          }))
        } catch (err) {
          console.error('[PendingWorkoutsModal] Error loading enrollments:', err)
          setEventsData(prev => prev.map(item => {
            if (item.id === event.id) {
              return { ...item, loadingEnrollments: false }
            }
            return item
          }))
        }
      }
    }

    loadEnrollments()
    setActiveEventIndex(0)
  }, [pendingList])

  if (pendingCount === 0 || isModalDismissed) return null

  const currentEvent = eventsData[activeEventIndex]
  if (!currentEvent) return null

  const handleSetStudentStatus = (enrollmentId: string, status: 'CONFIRMED' | 'ABSENT') => {
    setEventsData(prev => prev.map(item => {
      if (item.id === currentEvent.id) {
        return {
          ...item,
          evaluations: {
            ...item.evaluations,
            [enrollmentId]: status
          }
        }
      }
      return item
    }))
  }

  const handleEvaluateEvent = async (statusType: 'COMPLETED' | 'CANCELLED') => {
    setIsSubmitting(true)
    try {
      if (statusType === 'COMPLETED') {
        // 1. Update all enrollment statuses
        const updatePromises = Object.entries(currentEvent.evaluations).map(([enrollmentId, status]) => {
          return (supabase
            .from('event_enrollments' as any) as any)
            .update({ status })
            .eq('id', enrollmentId)
        })
        await Promise.all(updatePromises)

        // 2. Update calendar event status
        const { error: eventError } = await (supabase
          .from('calendar_events' as any) as any)
          .update({ status: 'COMPLETED' })
          .eq('id', currentEvent.id)

        if (eventError) throw eventError
      } else {
        // Cancel the event
        const { error: eventError } = await (supabase
          .from('calendar_events' as any) as any)
          .update({ status: 'CANCELLED' })
          .eq('id', currentEvent.id)

        if (eventError) throw eventError
      }

      // Reload pending workouts list
      await fetchPendingWorkouts()
    } catch (err) {
      console.error('[PendingWorkoutsModal] Error submitting evaluation:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const eventDate = new Date(currentEvent.start_datetime)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bee-midnight/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-bee-amber to-amber-400 p-6 text-bee-midnight">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <AlertTriangle className="h-6 w-6 text-bee-midnight animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display tracking-tight">Avaliações Pendentes</h3>
              <p className="text-xs font-semibold opacity-90 mt-0.5">
                Aula {activeEventIndex + 1} de {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 text-base">{currentEvent.title}</h4>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {format(eventDate, "HH:mm'h'", { locale: ptBR })}
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Lista de Alunos
            </span>

            {currentEvent.loadingEnrollments ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 className="h-6 w-6 text-bee-amber animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Carregando alunos...</span>
              </div>
            ) : currentEvent.enrollments.length === 0 ? (
              <p className="text-sm text-slate-400 italic bg-slate-50/50 py-6 text-center rounded-xl border border-dashed border-slate-200">
                Nenhum aluno agendado para esta aula.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {currentEvent.enrollments.map((enrollment) => {
                  const studentName = enrollment.students?.full_name || 'Aluno Desconhecido'
                  const currentStatus = currentEvent.evaluations[enrollment.id] || 'CONFIRMED'

                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors"
                    >
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">
                        {studentName}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(enrollment.id, 'CONFIRMED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === 'CONFIRMED'
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Presença
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStudentStatus(enrollment.id, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === 'ABSENT'
                              ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <X className="h-3.5 w-3.5" />
                          Falta
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleEvaluateEvent('CANCELLED')}
              className="flex-1 px-4 py-3 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Cancelar Aula
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting || (currentEvent.loadingEnrollments)}
              onClick={() => handleEvaluateEvent('COMPLETED')}
              className="flex-1 px-4 py-3 bg-bee-midnight hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-bee-midnight/10"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar Aula
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200/60">
            <button
              type="button"
              onClick={dismissModal}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Avaliar mais tarde
            </button>

            {pendingCount > 1 && (
              <span className="text-xs font-bold text-slate-400">
                Mais {pendingCount - 1} pendência{pendingCount - 1 > 1 ? 's' : ''} na fila
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
