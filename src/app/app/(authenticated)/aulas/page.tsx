'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, MapPin, User, Clock, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react';
import * as LucideIcons from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Badge } from '@/components/ui/badge';
import { ClassModal } from '@/components/painel/modals/class-modal';
import { EventDetailsModal } from '@/components/painel/modals/event-details-modal';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getClassType } from '@/lib/class-definitions';
import { useSubscription } from '@/hooks/useSubscription';

// Helper para renderizar ícone dinâmico
// --- COMPONENTE BLINDADO ---
const DynamicIcon = ({ name, className }: { name?: string | null; className?: string }) => {
  // 1. Defesa: Se não tiver nome, usa o padrão imediatamente
  if (!name) {
    return <LucideIcons.Dumbbell className={className} />;
  }

  try {
    // 2. Normalização: Converte "activity" -> "Activity"
    const normalizedName = name.charAt(0).toUpperCase() + name.slice(1);

    // 3. Busca no Lucide: Tenta o nome normalizado, o original, ou cai no fallback
    const IconComponent = (LucideIcons as any)[normalizedName] || (LucideIcons as any)[name] || LucideIcons.Dumbbell;

    return <IconComponent className={className} />;
  } catch (e) {
    // 4. Fallback final: Se qualquer coisa der errado na string, retorna o halter
    return <LucideIcons.Dumbbell className={className} />;
  }
};

interface ClassEvent {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  type: string | null;
  status: string;
  capacity_limit: number | null;
  enrollmentCount?: number;
  instructor: {
    name: string;
    id?: string | null;
  } | null;
  room: {
    name: string;
  } | null;
  color: string;
  iconName: string;
  template?: {
    icon: string;
    color: string;
    title: string;
  };
}

export default function ClassesPage() {
  const router = useRouter();
  const { hasFeature, loading: subLoading } = useSubscription();
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Guard: O plano agora permite aulas coletivas para todos os administradores SaaS
  /* 
  useEffect(() => {
    if (!subLoading && !hasFeature('aulas')) {
      router.replace('/app/painel');
    }
  }, [subLoading, hasFeature, router]);
  */

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('future'); // Default changed to future
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // New State for Details Modal
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();

  /* Pagination State */
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Trigger status update (SCHEDULED → IN_PROGRESS → COMPLETED) before fetching
      await supabase.rpc('update_class_statuses' as any);

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.organization_id) {
        console.warn("Usuário sem organização vinculada.");
        return;
      }
      const orgId = profile.organization_id;

      // 2. Query com Relacionamentos (JOINS) Restaurados + Template
      // Fetch com order ASC para pegar as próximas
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          instructor:instructors (name),
          room:rooms (name),
          enrollments:event_enrollments (count),
          template:class_template_id ( icon, color, title )
        `)
        .eq('organization_id', orgId)
        .eq('type', 'CLASS') // Only calendar event classes
        // Optimization: Fetch classes ending from 24h ago onwards to include Running & Recent, 
        // preventing ancient history from pushing current classes out of the default limit.
        .gte('end_datetime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('start_datetime', { ascending: true }); // Crescente: Mais perto do agora -> Futuro

      if (error) {
        console.error("❌ Erro no Fetch:", error);
        throw error;
      }

      // 3. Mapeamento Correto
      // 3. Mapeamento Correto
      const formattedData = data.map((event: any) => {
        // Resolve modality icon/color from CLASS_TYPES — single source of truth
        const title = event.title;
        const resolvedType = getClassType(event.template?.icon || null, title);

        // Safe Instructor Handling
        let instructorName = 'Sem instrutor';
        let instructorId = null;

        if (event.instructor) {
          if (Array.isArray(event.instructor) && event.instructor.length > 0) {
            instructorName = event.instructor[0].name;
            instructorId = event.instructor_id;
          } else if (typeof event.instructor === 'object' && !Array.isArray(event.instructor)) {
            instructorName = event.instructor.name;
            instructorId = event.instructor_id;
          }
        }

        return {
          id: event.id,
          title: title,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime,
          type: event.type,
          status: event.status,
          capacity_limit: event.capacity,
          instructor: { name: instructorName, id: instructorId },
          room: event.room || { name: 'Local não definido' },
          enrollmentCount: event.enrollments && event.enrollments[0] ? event.enrollments[0].count : 0,
          color: event.template?.color || resolvedType.color,
          iconName: event.template?.icon || resolvedType.iconName,
          template: event.template
        };
      }) as unknown as ClassEvent[];

      setClasses(formattedData);

    } catch (error: any) {
      console.error('Erro ao carregar aulas:', error);
      toast({
        variant: "destructive",
        title: 'Erro ao carregar',
        description: 'Não foi possível buscar os detalhes das aulas.'
      });
    } finally {
      setLoading(false);
    }
  }

  // Lógica de Filtragem e Ordenação (Derived State)
  const filteredAndSortedClasses = classes.filter(item => {
    // 1. Busca Geral
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(searchLower);
    const instructorMatch = item.instructor?.name?.toLowerCase().includes(searchLower);
    const matchesSearch = titleMatch || instructorMatch;

    // 2. Filtro de Status/Tempo
    const now = new Date();
    const start = new Date(item.start_datetime);
    const end = new Date(item.end_datetime);

    // "isPast" agora considera o FIM. Se acabou, é passado. Se está rolando, não é passado.
    const isFinished = end < now;

    let matchesStatus = true;
    if (statusFilter === 'future') {
      const isRunning = start <= now && end > now;
      const isFuture = start > now;
      matchesStatus = (isRunning || isFuture) && item.status !== 'CANCELLED' && item.status !== 'COMPLETED';
    } else if (statusFilter === 'realized') {
      matchesStatus = item.status === 'COMPLETED' || isFinished;
    } else if (statusFilter !== 'all') {
      matchesStatus = item.status === statusFilter;
    }

    // 3. Instrutor
    const matchesInstructor = instructorFilter === 'all' || item.instructor?.id === instructorFilter;

    // 4. Período
    let matchesPeriod = true;
    if (periodFilter !== 'all') {
      const hour = start.getHours();
      if (periodFilter === 'morning') matchesPeriod = hour >= 5 && hour < 12;
      if (periodFilter === 'afternoon') matchesPeriod = hour >= 12 && hour < 18;
      if (periodFilter === 'night') matchesPeriod = hour >= 18;
    }

    // 5. Disponibilidade
    const matchesAvailability = availabilityFilter === 'all' ||
      (availabilityFilter === 'open' && (item.enrollmentCount || 0) < (item.capacity_limit || 0));

    // 6. Tipo
    const matchesType = typeFilter === 'all' || item.template?.title === typeFilter;

    // 7. Data Range
    let matchesDate = true;
    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDate = isWithinInterval(start, { start: from, end: to });
    }

    return matchesSearch && matchesStatus && matchesInstructor && matchesPeriod && matchesAvailability && matchesType && matchesDate;
  }).sort((a, b) => {
    // 1. Em execução primeiro (Calculado dinamicamente)
    // Se statusFilter for 'realized', essa lógica de "em execução" pode não ser tão crítica, mas mantemos consistência.
    const now = new Date();
    const isRunningA = new Date(a.start_datetime) <= now && new Date(a.end_datetime) > now;
    const isRunningB = new Date(b.start_datetime) <= now && new Date(b.end_datetime) > now;

    if (isRunningA && !isRunningB) return -1;
    if (!isRunningA && isRunningB) return 1;

    // 2. Data mais próxima
    const timeDiff = new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
    if (timeDiff !== 0) return timeDiff;

    // 3. Alfabetico Nome da Aula
    const titleA = a.title || '';
    const titleB = b.title || '';
    const titleDiff = titleA.localeCompare(titleB);
    if (titleDiff !== 0) return titleDiff;

    // 4. Alfabetico Modalidade
    const modA = a.template?.title || '';
    const modB = b.template?.title || '';
    const modDiff = modA.localeCompare(modB);
    if (modDiff !== 0) return modDiff;

    // 5. Alfabetico Instrutor
    const instA = a.instructor?.name || '';
    const instB = b.instructor?.name || '';
    return instA.localeCompare(instB);
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedClasses.length / ITEMS_PER_PAGE);
  const paginatedClasses = filteredAndSortedClasses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent row click
    // TODO: Implement delete
    toast({
      title: 'Ainda não implementado',
      description: 'Função de deletar será implementada em breve.',
    });
  }

  const handleRowClick = (event: ClassEvent) => {
    setSelectedEvent(event);
    setDetailsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none">Realizada</Badge>;
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Em Andamento
          </span>
        );
      case 'SCHEDULED':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600 border-none">Agendada</Badge>;
      case 'MISSED':
        return <Badge className="bg-slate-900 text-white hover:bg-slate-900 border-none">Faltou</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500 text-white hover:bg-red-600 border-none">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#FFBF00] rounded-full" />
          <div>
            <h2 className="text-base font-bold text-[#0B0F1A] font-display">Aulas Agendadas</h2>
            <p className="text-xs text-slate-400">Próximas aulas coletivas do calendário</p>
          </div>
        </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="h-10 px-6 bg-bee-amber hover:bg-amber-500 text-bee-midnight font-black rounded-full shadow-lg shadow-bee-amber/10 transition-all hover:scale-[1.02] active:scale-0.98 uppercase tracking-widest text-[11px]"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3px]" /> Nova Aula
          </Button>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="relative w-full xl:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por aula ou instrutor..."
            className="pl-9 bg-slate-50 border-slate-200 rounded-full font-sans h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap xl:flex-nowrap gap-2 w-full xl:w-auto items-center justify-end">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block mr-2" />

          {/* Date Range Picker */}
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[200px] h-9 justify-start text-left font-normal text-xs rounded-full transition-all hover:-translate-y-0.5 active:scale-95",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/y", { locale: ptBR })
                    )
                  ) : (
                    <span>Data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          {dateRange && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDateRange(undefined)} title="Limpar datas">
              <X className="h-4 w-4" />
            </Button>
          )}

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] h-9 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-full focus:ring-1 focus:ring-orange-200 transition-all hover:-translate-y-0.5 active:scale-95">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="future">Próximas</SelectItem>
              <SelectItem value="realized">Realizadas</SelectItem>
              <SelectItem value="CANCELLED">Canceladas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[140px] h-9 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-full focus:ring-1 focus:ring-orange-200 transition-all hover:-translate-y-0.5 active:scale-95">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Período</SelectItem>
              <SelectItem value="morning">Manhã</SelectItem>
              <SelectItem value="afternoon">Tarde</SelectItem>
              <SelectItem value="night">Noite</SelectItem>
            </SelectContent>
          </Select>

          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger className="w-[150px] h-9 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-full focus:ring-1 focus:ring-orange-200 transition-all hover:-translate-y-0.5 active:scale-95">
              <SelectValue placeholder="Instrutor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Instrutores</SelectItem>
              {Array.from(new Set(classes.map(c => c.instructor?.name).filter(Boolean))).map((name) => {
                const id = classes.find(c => c.instructor?.name === name)?.instructor?.id;
                return <SelectItem key={id} value={id as string}>{name as string}</SelectItem>
              })}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 text-[11px] font-bold uppercase tracking-wider border-slate-100 bg-white shadow-sm rounded-full focus:ring-1 focus:ring-orange-200 transition-all hover:-translate-y-0.5 active:scale-95">
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Modalidades</SelectItem>
              {Array.from(new Set(classes.map(c => c.template?.title).filter(Boolean))).map((title) => (
                <SelectItem key={title as string} value={title as string}>{title as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Aula</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Data/Hora</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Instrutor</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Local</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Capacidade</TableHead>
              <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Status</TableHead>
              <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Carregando aulas...
                </TableCell>
              </TableRow>
            ) : filteredAndSortedClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhuma aula encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              paginatedClasses.map((cls) => {
                const dateParams = { locale: ptBR };
                const startDate = new Date(cls.start_datetime);

                // Safe defaults
                const capacity = cls.capacity_limit || 0;
                const enrolled = cls.enrollmentCount || 0;
                const isFull = capacity > 0 && enrolled >= capacity;

                return (
                  <TableRow
                    key={cls.id}
                    className="cursor-pointer hover:bg-slate-50/50 transition-colors group"
                    onClick={() => handleRowClick(cls)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm"
                          style={{
                            backgroundColor: `${cls.color}20`,
                            borderColor: `${cls.color}40`,
                            color: cls.color
                          }}
                        >
                          <DynamicIcon name={cls.iconName} className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-bee-amber transition-colors font-sans">{cls.title}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                        <CalendarIcon className="w-4 h-4 text-bee-amber" />
                        {format(startDate, "dd MMM '•' HH:mm", dateParams)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-slate-600">
                        {cls.instructor ? (
                          <>
                            <User className="h-4 w-4 text-slate-400" />
                            <span>{cls.instructor.name || 'Instrutor'}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm italic font-normal">Sem instrutor</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cls.room ? (
                        <div className="flex items-center gap-2 font-medium text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{cls.room.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic font-normal">Local não definido</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {capacity > 0 ? (
                        <Badge variant="outline" className={`${(() => {
                          const percentage = (enrolled / capacity) * 100;
                          if (percentage >= 100) return "bg-red-100 text-red-700 border-red-200";
                          if (percentage > 70) return "bg-amber-100 text-amber-700 border-amber-200";
                          return "bg-emerald-100 text-emerald-700 border-emerald-200";
                        })()
                          }`}>
                          {enrolled} / {capacity}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(cls.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 pr-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-bee-midnight hover:bg-bee-amber/10 hover:text-bee-amber rounded-xl transition-all border border-transparent hover:border-bee-amber/20 shadow-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(cls);
                            setDetailsModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-destructive rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shadow-none"
                          onClick={(e) => handleDelete(e, cls.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedClasses.length > 0 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-full shadow-sm hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <div className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="rounded-full shadow-sm hover:-translate-y-0.5 transition-all active:scale-95"
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <ClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchClasses}
      />

      {/* Details/Enrollment Modal */}
      <EventDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        event={selectedEvent ? {
          ...selectedEvent,
          eventType: 'CLASS'
        } : null}
        onSuccess={() => {
          fetchClasses(); // Refresh list to update counts
        }}
      />
    </div>
  );
}
