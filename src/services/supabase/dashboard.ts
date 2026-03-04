
import { createClient } from "@/lib/supabase/client";
import { format, isToday, parseISO } from "date-fns";

export type KPI = {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    description: string;
    iconName: string; // We'll map this to Lucide icons in the UI
    iconBgColor: string;
    iconColor: string;
}

export type ScheduleItem = {
    id: string; // Added for unique keys
    time: string;
    name: string;
    type: string;
    trainer: string;
    capacity: string;
    status: string;
    statusColor: string;
    classType: 'individual' | 'group' | 'open';
    date: Date; // Added for correct sorting/filtering
    title?: string; // Optional title override
    template?: {
        icon?: string;
        color?: string;
        title?: string;
    };
    enrollmentCount?: number;
    numericCapacity?: number;
}

export type Alert = {
    title: string;
    description: string;
    iconName: string;
    color: 'destructive' | 'yellow' | 'blue';
    action: string;
    href: string;
}

export async function getKPIs(unitId?: string): Promise<KPI[]> {
    const supabase = createClient();

    try {
        // 1. Active Students
        let studentsQuery = supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE');
        if (unitId && unitId.length > 10) studentsQuery = studentsQuery.eq('organization_id', unitId);

        const { count: activeStudents, error: studentsError } = await studentsQuery;
        if (studentsError) console.error("Error fetching active students:", studentsError);

        // 2. Scheduled Workouts / Events Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        let eventsQuery = supabase
            .from('calendar_events')
            .select('id', { count: 'exact', head: true })
            .gte('start_datetime', startOfDay.toISOString())
            .lte('start_datetime', endOfDay.toISOString());

        if (unitId && unitId.length > 10) eventsQuery = eventsQuery.eq('organization_id', unitId); // Changed unit_id to organization_id

        const { count: eventsToday, error: eventsError } = await eventsQuery;
        if (eventsError) console.error("Error fetching events today:", eventsError);

        return [
            {
                title: 'Alunos Ativos',
                value: (activeStudents || 0).toString(),
                change: '+0', // Placeholder
                changeType: 'neutral',
                description: 'total cadastrado',
                iconName: 'UserCheck',
                iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-500 dark:text-blue-400',
            },
            {
                title: 'Receita Mensal',
                value: 'R$ 0,00', // Placeholder until payments implemented
                change: '0%',
                changeType: 'neutral',
                description: 'estimado',
                iconName: 'BarChart3',
                iconBgColor: 'bg-primary/10',
                iconColor: 'text-primary',
            },
            {
                title: 'Pagamentos Pendentes',
                value: 'R$ 0,00', // Placeholder
                change: '0%',
                changeType: 'neutral',
                description: 'em relação ao mês anterior',
                iconName: 'AlertTriangle',
                iconBgColor: 'bg-yellow-500/10',
                iconColor: 'text-yellow-500',
            },
            {
                title: 'Aulas Hoje',
                value: (eventsToday || 0).toString(),
                change: '0',
                changeType: 'neutral',
                description: 'agendadas',
                iconName: 'List',
                iconBgColor: 'bg-secondary',
                iconColor: 'text-secondary-foreground',
            }
        ];
    } catch (e) {
        console.error("Critical error in getKPIs:", e);
        // Return safe empty/zero KPIs
        return [
            { title: 'Alunos Ativos', value: '0', change: '-', changeType: 'neutral', description: 'Erro ao carregar', iconName: 'UserCheck', iconBgColor: 'bg-gray-100', iconColor: 'text-gray-500' },
            { title: 'Receita Mensal', value: '-', change: '-', changeType: 'neutral', description: 'Erro ao carregar', iconName: 'BarChart3', iconBgColor: 'bg-gray-100', iconColor: 'text-gray-500' },
            { title: 'Pagamentos Pendentes', value: '-', change: '-', changeType: 'neutral', description: 'Erro ao carregar', iconName: 'AlertTriangle', iconBgColor: 'bg-gray-100', iconColor: 'text-gray-500' },
            { title: 'Aulas Hoje', value: '0', change: '-', changeType: 'neutral', description: 'Erro ao carregar', iconName: 'List', iconBgColor: 'bg-gray-100', iconColor: 'text-gray-500' }
        ];
    }
}

import { QueryData } from '@supabase/supabase-js';

export async function getUpcomingClasses(organizationId?: string): Promise<ScheduleItem[]> {
    const supabase = createClient();

    // TRAVA DE SEGURANÇA: Só busca se tiver o ID da organização
    if (!organizationId) return [];

    try {
        // Busca na tabela nova 'calendar_events', juntando 'instructors' e 'class_templates'
        const { data, error } = await supabase
            .from('calendar_events')
            .select(`
                id,
                start_datetime,
                end_datetime,
                status,
                type,
                rooms (
                    name
                ),
                instructors (
                    name
                ),
                class_templates (
                    title,
                    color,
                    icon
                )
            `)
            // Note: If DB has 'class_template_id', Supabase/PostgREST usually maps this to 'class_templates' relationship.
            // If it fails with "Could not find relationship", the user might need to rename the relation or use 'class_templates:class_template_id(...)' syntax if ambiguous.
            .eq('organization_id', organizationId)
            .gte('start_datetime', new Date().toISOString()) // Busca eventos futuros
            .order('start_datetime', { ascending: true })
            .limit(5);

        if (error) {
            console.error("Error fetching classes:", error);
            // Retorna array vazio em caso de erro para não quebrar a tela
            return [];
        }

        // Mapeia para o formato que o componente visual espera (ScheduleItem)
        return (data as any[]).map(event => {
            const startTime = new Date(event.start_datetime);
            const template = event.class_templates || {};
            const instructor = event.instructors || {};

            return {
                id: event.id, // Added ID
                time: format(startTime, 'HH:mm'), // Formata para hora:min
                name: template.title || 'Sem título',
                type: event.type || 'AULA',
                trainer: instructor.name || 'Instrutor',
                capacity: '0/0', // Capacidade mockada por enquanto
                status: event.status === 'SCHEDULED' ? 'Agendado' : event.status,
                statusColor: 'bg-blue-100 text-blue-700', // Padrão
                classType: 'group', // Default safe value
                date: startTime // Objeto Date real para ordenação/comparação
            };
        });

    } catch (error) {
        console.error("Unexpected error in getUpcomingClasses:", error);
        return [];
    }
}

export async function getAlerts(unitId?: string): Promise<Alert[]> {
    const supabase = createClient();
    try {
        // Example Alert: Inactive Students
        let query = supabase
            .from('students')
            .select(`id, full_name, status`)
            .eq('status', 'INACTIVE')
            .limit(3);

        if (unitId && unitId.length > 10) query = query.eq('organization_id', unitId);

        const { data: inactiveStudents, error } = await query;
        if (error) {
            console.error("Error fetching alerts:", error);
            return [];
        }

        const alerts: Alert[] = [];

        if (inactiveStudents && inactiveStudents.length > 0) {
            alerts.push({
                title: 'Alunos Inativos',
                description: `${inactiveStudents.length} alunos estão marcados como inativos.`,
                iconName: 'UserX',
                color: 'yellow',
                action: 'Ver Lista',
                href: '/painel/alunos'
            });
        }

        return alerts;
    } catch (e) {
        console.error("Critical error in getAlerts:", e);
        return [];
    }
}
