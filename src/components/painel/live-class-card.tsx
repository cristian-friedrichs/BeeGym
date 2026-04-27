'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Timer, ChevronLeft, ChevronRight, GraduationCap, Dumbbell, Calendar, Plus, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { NewTrainingModal } from './modals/new-training-modal';
import { CreateRecurringClassModal } from './modals/create-recurring-class-modal';

interface LiveEvent {
    id: string;
    name: string;
    event_type: 'AULA' | 'TREINO';
    start_time: string;
    end_time: string;
    capacity: number;
    instructor_id: string;
    instructor?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    } | null;
    unit?: {
        id: string;
        name: string;
    } | null;
    room?: {
        id: string;
        name: string;
    } | null;
    attendees: Array<{
        id: string;
        student: {
            id: string;
            full_name: string;
            avatar_url: string | null;
        };
        status: string;
        confirmed_by_user: string | null;
    }>;
}

// Hook for independent timer per event
function useElapsedTime(startTime: string) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = new Date(startTime).getTime();

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - start) / 1000);
            setElapsed(diff >= 0 ? diff : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return {
        formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
        minutes,
        seconds
    };
}

export function LiveClassCard() {
    const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [checkingInIds, setCheckingInIds] = useState<Set<string>>(new Set());
    const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
    const [classModalOpen, setClassModalOpen] = useState(false);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    const currentEvent = liveEvents[currentEventIndex];
    const elapsedTime = useElapsedTime(currentEvent?.start_time || new Date().toISOString());

    // Fetch Organization ID once
    useEffect(() => {
        async function fetchOrgId() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: userData } = await (supabase as any)
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();
                if (userData?.organization_id) {
                    setOrganizationId(userData.organization_id);
                }
            }
        }
        fetchOrgId();
    }, [supabase]);

    const fetchLiveEvents = useCallback(async () => {
        // TRAVA DE SEGURANÇA: Só busca se tiver o ID da organização
        if (!organizationId) return;

        try {
            const now = new Date().toISOString();

            // Busca eventos que estão acontecendo AGORA na tabela nova
            const { data, error } = await (supabase as any)
                .from('calendar_events')
                .select(`
                    id,
                    title,
                    start_datetime,
                    end_datetime,
                    status,
                    rooms ( name ),
                    instructor:instructors ( name )
                `)
                .eq('organization_id', organizationId)
                .lte('start_datetime', now) // Começou antes de agora
                .gte('end_datetime', now)   // Termina depois de agora
                .limit(5); // Aumentamos para pegar mais de um se houver

            if (error) {
                console.error('Error fetching live events:', error);
                setLiveEvents([]);
                return;
            }

            if (data) {
                const formattedEvents = (data as any[]).map(event => ({
                    id: event.id,
                    name: event.title,
                    event_type: 'TREINO',
                    start_time: event.start_datetime,
                    end_time: event.end_datetime,
                    instructor: {
                        full_name: event.instructor?.name || 'Instrutor',
                        avatar_url: null
                    },
                    room: event.rooms ? { name: event.rooms.name } : null,
                    attendees: []
                }));
                setLiveEvents(formattedEvents as any);
            }

        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setIsLoading(false); // LIBERA A TELA
        }
    }, [supabase, organizationId]);

    useEffect(() => {
        if (organizationId) {
            fetchLiveEvents();
            const interval = setInterval(fetchLiveEvents, 30000);
            return () => clearInterval(interval);
        }
    }, [fetchLiveEvents, organizationId]);

    // Quick check-in handler
    const handleQuickCheckIn = async (attendanceLogId: string, studentName: string) => {
        setCheckingInIds(prev => new Set(prev).add(attendanceLogId));

        try {
            // TODO: Aguardando definição de design do BD para execução de treinos/presença.
            // Tabela `attendance_logs` não existe (audit 2026-04-25).
            // const { error } = await (supabase as any)
            //     .from('attendance_logs')
            //     .update({
            //         status: 'PRESENT',
            //         confirmed_by_user: 'TRUE'
            //     })
            //     .eq('id', attendanceLogId);
            // if (error) throw error;
            const error: any = null;
            if (error) throw error;

            // Optimistic UI update
            setLiveEvents(prev => prev.map(event => ({
                ...event,
                attendees: event.attendees.map(att =>
                    att.id === attendanceLogId
                        ? { ...att, status: 'PRESENT', confirmed_by_user: 'TRUE' }
                        : att
                )
            })));

            toast({
                title: 'Check-in realizado!',
                description: `${studentName} marcado como presente.`,
            });
        } catch (error: any) {
            console.error('Error checking in:', error);
            toast({
                title: 'Erro ao fazer check-in',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setCheckingInIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(attendanceLogId);
                return newSet;
            });
        }
    };

    // Carousel navigation
    const nextEvent = () => {
        setCurrentEventIndex((prev) => (prev + 1) % liveEvents.length);
    };

    const prevEvent = () => {
        setCurrentEventIndex((prev) => (prev - 1 + liveEvents.length) % liveEvents.length);
    };

    // Loading state
    if (isLoading) {
        return (
            <Card className="p-8 animate-pulse">
                <div className="h-24 bg-muted rounded-lg"></div>
            </Card>
        );
    }

    // Fallback: No live events
    if (liveEvents.length === 0) {
        return (
            <Card className="p-8 text-center border-dashed">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Nenhuma atividade agora</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Que tal planejar a próxima atividade?
                        </p>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <Button
                            onClick={() => setWorkoutModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg shadow-sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Treino
                        </Button>
                        <Button
                            onClick={() => setClassModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg shadow-sm"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Aula
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    // Get event type badge configuration
    const getEventBadge = (type: 'AULA' | 'TREINO') => {
        if (type === 'AULA') {
            return {
                icon: <GraduationCap className="w-3 h-3 mr-1" />,
                label: 'AULA',
                className: 'bg-blue-500 hover:bg-blue-600 text-white'
            };
        }
        return {
            icon: <Dumbbell className="w-3 h-3 mr-1" />,
            label: 'TREINO',
            className: 'bg-orange-500 hover:bg-orange-600 text-white'
        };
    };

    const eventBadge = getEventBadge(currentEvent.event_type);
    const presentStudents = currentEvent.attendees.filter(a => a.status === 'PRESENT');

    return (
        <TooltipProvider>
            <section className="bg-card rounded-3xl p-6 shadow-soft relative overflow-hidden flex flex-col gap-6 border">
                {/* Accent bar */}
                <div className="absolute left-0 top-0 h-full w-2 bg-primary"></div>

                {/* Header with carousel navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold uppercase tracking-wide">
                            Ao Vivo Agora
                        </span>
                        <Badge className={eventBadge.className}>
                            {eventBadge.icon}
                            {eventBadge.label}
                        </Badge>
                    </div>

                    {/* Carousel controls */}
                    {liveEvents.length > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={prevEvent}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground font-medium min-w-[40px] text-center">
                                {currentEventIndex + 1} / {liveEvents.length}
                            </span>
                            <Button
                                onClick={nextEvent}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-display font-bold text-foreground mb-2 truncate">
                            {currentEvent.name || 'Aula sem nome'}
                        </h2>

                        <div className="flex flex-col gap-2">
                            {/* Instructor */}
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={currentEvent.instructor?.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                        {currentEvent.instructor?.full_name
                                            ?.split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase() || 'IN'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs text-muted-foreground">Instrutor</p>
                                    <p className="text-sm font-medium">
                                        {currentEvent.instructor?.full_name || 'Instrutor não definido'}
                                    </p>
                                </div>
                            </div>

                            {/* Location */}
                            {currentEvent.unit && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">
                                        {currentEvent.unit.name}
                                        {currentEvent.room && ` - ${currentEvent.room.name}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats panel */}
                    <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border w-full lg:w-auto">
                        {/* Timer */}
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                                Tempo Decorrido
                            </p>
                            <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold text-primary">
                                <Timer className="w-5 h-5" />
                                {elapsedTime.formatted}
                            </div>
                        </div>

                        <div className="h-16 w-px bg-border"></div>

                        {/* Students count */}
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                                Presença
                            </p>
                            <p className="text-2xl font-bold">
                                {presentStudents.length}/{currentEvent.attendees.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Students list with quick check-in */}
                {currentEvent.attendees.length > 0 && (
                    <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-3">Alunos nesta aula:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                            {currentEvent.attendees.map((attendee) => (
                                <div
                                    key={attendee.id}
                                    className={cn(
                                        "flex items-center justify-between gap-2 p-2 rounded-lg border",
                                        attendee.status === 'PRESENT' ? "bg-green-50 border-green-200" : "bg-background"
                                    )}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={attendee.student.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {attendee.student.full_name
                                                    ?.split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium truncate">
                                            {attendee.student.full_name}
                                        </span>
                                    </div>
                                    {attendee.status === 'PRESENT' ? (
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 flex-shrink-0">
                                            <Check className="w-3 h-3 mr-1" />
                                            Presente
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleQuickCheckIn(attendee.id, attendee.student.full_name)}
                                            disabled={checkingInIds.has(attendee.id)}
                                            className="flex-shrink-0"
                                        >
                                            {checkingInIds.has(attendee.id) ? 'Confirmando...' : 'Check-in'}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Modals */}
            <NewTrainingModal
                open={workoutModalOpen}
                onOpenChange={setWorkoutModalOpen}
                onSuccess={() => {
                    setIsLoading(true);
                    fetchLiveEvents();
                }}
            />
            <CreateRecurringClassModal
                open={classModalOpen}
                onOpenChange={setClassModalOpen}
                onSuccess={() => {
                    setIsLoading(true);
                    fetchLiveEvents();
                }}
            />
        </TooltipProvider>
    );
}
