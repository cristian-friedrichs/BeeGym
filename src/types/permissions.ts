// RBAC Permission Types for BeeGym

export interface ModulePermission {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    manage?: boolean;
}

export interface Permissions {
    dashboard: ModulePermission;
    agenda: ModulePermission;
    classes: ModulePermission;
    students: ModulePermission;
    chat: ModulePermission;
    financial: ModulePermission;
    exercises: ModulePermission;
    workouts: ModulePermission;
    reports: ModulePermission;
    settings: ModulePermission;
}

export interface AppRole {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    permissions: Permissions;
    created_at: string;
}

export const DEFAULT_PERMISSIONS: Permissions = {
    dashboard: { view: false },
    agenda: { view: false, manage: false },
    classes: { view: false, manage: false },
    students: { view: false, create: false, edit: false, delete: false },
    chat: { view: false, manage: false },
    financial: { view: false, manage: false },
    exercises: { view: false, manage: false },
    workouts: { view: false, manage: false },
    reports: { view: false },
    settings: { view: false, manage: false },
};

export const FULL_PERMISSIONS: Permissions = {
    dashboard: { view: true },
    agenda: { view: true, manage: true },
    classes: { view: true, manage: true },
    students: { view: true, create: true, edit: true, delete: true },
    chat: { view: true, manage: true },
    financial: { view: true, manage: true },
    exercises: { view: true, manage: true },
    workouts: { view: true, manage: true },
    reports: { view: true },
    settings: { view: true, manage: true },
};

export interface PermissionModuleConfig {
    key: keyof Permissions;
    label: string;
    description: string;
    actions: { key: string; label: string }[];
}

export const PERMISSION_MODULES: PermissionModuleConfig[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Painel principal com indicadores e métricas',
        actions: [{ key: 'view', label: 'Visualizar' }],
    },
    {
        key: 'agenda',
        label: 'Agenda',
        description: 'Agendamento de horários e check-in de alunos',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'manage', label: 'Gerenciar' },
        ],
    },
    {
        key: 'classes',
        label: 'Aulas',
        description: 'Gestão de aulas e grade de horários',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'manage', label: 'Gerenciar' },
        ],
    },
    {
        key: 'students',
        label: 'Alunos',
        description: 'Gestão de alunos e matrículas',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'create', label: 'Criar' },
            { key: 'edit', label: 'Editar' },
            { key: 'delete', label: 'Excluir' },
        ],
    },
    {
        key: 'chat',
        label: 'Conversas',
        description: 'Mensagens e comunicação com alunos',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'manage', label: 'Gerenciar' },
        ],
    },
    {
        key: 'financial',
        label: 'Financeiro',
        description: 'Cobranças, pagamentos e relatórios financeiros',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'manage', label: 'Gerenciar' },
        ],
    },
    {
        key: 'exercises',
        label: 'Exercícios',
        description: 'Biblioteca de exercícios disponíveis',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'manage', label: 'Gerenciar' },
        ],
    },
    {
        key: 'workouts',
        label: 'Treinos',
        description: 'Montagem e gestão de fichas de treino',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'manage', label: 'Gerenciar' },
        ],
    },
    {
        key: 'reports',
        label: 'Relatórios',
        description: 'Relatórios e análises de desempenho',
        actions: [{ key: 'view', label: 'Visualizar' }],
    },
    {
        key: 'settings',
        label: 'Configurações',
        description: 'Configurações gerais da academia',
        actions: [
            { key: 'view', label: 'Visualizar' },
            { key: 'manage', label: 'Gerenciar' },
        ],
    },
];
