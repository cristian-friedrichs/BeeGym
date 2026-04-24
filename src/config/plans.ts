import { User, Zap, Dumbbell, Building2, Crown, LucideIcon } from 'lucide-react'

export type PlanFeature =
    | 'app_aluno'
    | 'painel'
    | 'agenda'
    | 'aulas'
    | 'treinos'
    | 'alunos'
    | 'conversas'
    | 'pagamentos'
    | 'exercicios'
    | 'relatorios'
    | 'configuracoes'
    | 'crm'
    | 'automacao_cobranca'
    | 'frequencia'
    | 'salas'
    | 'api_acesso'
    | 'alertas'
    | 'multiplos_agendamentos'
    | 'multiplos_usuarios'
    | 'multipropriedade'
    | 'api_externa'
    | 'suporte_prioritario'
    | 'white_label'

export interface BeeGymPlan {
    id: string
    name: string
    description: string
    max_students: number | null
    price: number
    promo_price?: number
    promo_duration_months?: number
    startingFrom?: boolean
    featuresList: string[]
    allowedFeatures: PlanFeature[]
    icon: typeof User
    kiwify_link?: string
}

export const BEEGYM_PLANS: Record<string, BeeGymPlan> = {
    plan_starter: {
        id: 'plan_starter',
        name: 'STARTER',
        description: 'Ideal para profissionais independentes e iniciantes.',
        max_students: 20,
        price: 19.90,
        promo_price: 9.90,
        promo_duration_months: 3,
        featuresList: [
            'Até 20 Alunos Ativos',
            'Gestão de Alunos e Pagamentos',
            'Calendário e Agenda',
            'Prescrição de Treinos',
            'Biblioteca de Exercícios',
        ],
        allowedFeatures: ['painel', 'agenda', 'treinos', 'alunos', 'pagamentos', 'exercicios', 'frequencia', 'configuracoes'],
        icon: User,
        kiwify_link: 'https://pay.kiwify.com.br/nDh67eT',
    },
    plan_plus: {
        id: 'plan_plus',
        name: 'PLUS',
        description: 'Para quem está crescendo e precisa de mais espaço.',
        max_students: 40,
        price: 29.90,
        promo_price: 19.90,
        promo_duration_months: 3,
        featuresList: [
            'Até 40 Alunos Ativos',
            'Tudo do STARTER',
            'Relatórios Básicos',
        ],
        allowedFeatures: ['painel', 'agenda', 'treinos', 'alunos', 'pagamentos', 'exercicios', 'frequencia', 'configuracoes'],
        icon: Zap,
        kiwify_link: 'https://pay.kiwify.com.br/l0J7aBG',
    },
    plan_studio: {
        id: 'plan_studio',
        name: 'STUDIO',
        description: 'Perfeito para Studios e Boxes com turmas e treinos coletivos.',
        max_students: 100,
        price: 49.90,
        promo_price: 29.90,
        promo_duration_months: 3,
        featuresList: [
            'Até 100 Alunos Ativos',
            'Tudo do PLUS',
            'App do Aluno (em breve)',
            'Multi-instrutores e Salas',
            'Aulas Coletivas e Turmas',
        ],
        allowedFeatures: ['painel', 'agenda', 'treinos', 'alunos', 'pagamentos', 'exercicios', 'frequencia', 'configuracoes', 'app_aluno', 'conversas', 'aulas', 'multiplos_agendamentos', 'salas', 'multiplos_usuarios'],
        icon: Dumbbell,
        kiwify_link: 'https://pay.kiwify.com.br/6N4RjAj',
    },
    plan_pro: {
        id: 'plan_pro',
        name: 'PRO',
        description: 'Gestão completa para Academias de médio porte.',
        max_students: 500,
        price: 79.90,
        promo_price: 49.90,
        promo_duration_months: 3,
        featuresList: [
            'Até 500 Alunos Ativos',
            'Tudo do STUDIO',
            'Múltiplos Usuários/Instrutores',
            'Automação de Cobrança (breve)',
            'CRM de Vendas (breve)',
            'Relatórios Avançados',
        ],
        allowedFeatures: ['painel', 'agenda', 'treinos', 'alunos', 'pagamentos', 'exercicios', 'frequencia', 'configuracoes', 'app_aluno', 'conversas', 'aulas', 'multiplos_agendamentos', 'salas', 'multiplos_usuarios', 'automacao_cobranca', 'crm', 'relatorios'],
        icon: Building2,
        kiwify_link: 'https://pay.kiwify.com.br/7snTI43',
    },
    plan_enterprise: {
        id: 'plan_enterprise',
        name: 'ENTERPRISE',
        description: 'Solução ilimitada para grandes redes e franqueadoras.',
        max_students: null, // unlimited
        price: 0, // custom
        featuresList: [
            'Alunos Ilimitados',
            'Tudo do PRO',
            'Multi Propriedades e Filiais (breve)',
            'API Externa (breve)',
            'White Label',
            'Suporte Prioritário',
        ],
        allowedFeatures: ['painel', 'agenda', 'treinos', 'alunos', 'pagamentos', 'exercicios', 'frequencia', 'configuracoes', 'app_aluno', 'conversas', 'aulas', 'multiplos_agendamentos', 'salas', 'multiplos_usuarios', 'automacao_cobranca', 'crm', 'relatorios', 'multipropriedade', 'api_externa', 'api_acesso', 'alertas', 'white_label'],
        icon: Crown,
    },
}

export const getPlanById = (id: string | null | undefined): BeeGymPlan => {
    if (!id) return BEEGYM_PLANS.plan_starter // Default fallback
    return BEEGYM_PLANS[id] || BEEGYM_PLANS.plan_starter
}
