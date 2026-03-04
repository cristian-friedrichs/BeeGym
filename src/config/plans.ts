import { User, Zap, Dumbbell, Building2, Crown, LucideIcon } from 'lucide-react'

export type PlanFeature =
    | 'app_aluno'
    | 'chat'
    | 'aulas_coletivas'
    | 'multiplos_agendamentos'
    | 'multiplos_usuarios'
    | 'cobranca_automatizada'
    | 'multipropriedade'
    | 'api_externa'

export interface BeeGymPlan {
    id: string
    name: string
    description: string
    max_students: number | null
    price: number
    promo_price?: number
    startingFrom?: boolean
    featuresList: string[]
    allowedFeatures: PlanFeature[]
    icon: typeof User
}

export const BEEGYM_PLANS: Record<string, BeeGymPlan> = {
    plan_starter: {
        id: 'plan_starter',
        name: 'STARTER',
        description: 'Ideal para profissionais independentes e iniciantes.',
        max_students: 20,
        price: 19.90,
        promo_price: 9.90,
        featuresList: ['Gestão de Alunos e Pagamentos', 'Calendário Completo', 'Controle de Frequência e Treinos', 'Relatórios e Alertas'],
        allowedFeatures: [],
        icon: User,
    },
    plan_plus: {
        id: 'plan_plus',
        name: 'PLUS',
        description: 'Para quem está crescendo e precisa de mais espaço.',
        max_students: 40,
        price: 29.90,
        promo_price: 19.90,
        featuresList: ['Tudo do STARTER', 'App do Aluno', 'Chat'],
        allowedFeatures: ['app_aluno', 'chat'],
        icon: Zap,
    },
    plan_studio: {
        id: 'plan_studio',
        name: 'STUDIO',
        description: 'Perfeito para Studios e Boxes com turmas e treinos coletivos.',
        max_students: 100,
        price: 49.90,
        promo_price: 29.90,
        featuresList: ['Tudo do PLUS', 'Aulas Coletivas e Turmas', 'Múltiplos Agendamentos'],
        allowedFeatures: ['app_aluno', 'chat', 'aulas_coletivas', 'multiplos_agendamentos'],
        icon: Dumbbell,
    },
    plan_pro: {
        id: 'plan_pro',
        name: 'PRO',
        description: 'Gestão completa para Academias de médio porte.',
        max_students: 400,
        price: 79.90,
        promo_price: 49.90,
        featuresList: ['Tudo do STUDIO', 'Múltiplos Usuários/Instrutores', 'Automatização de Cobrança'],
        allowedFeatures: ['app_aluno', 'chat', 'aulas_coletivas', 'multiplos_agendamentos', 'multiplos_usuarios', 'cobranca_automatizada'],
        icon: Building2,
    },
    plan_enterprise: {
        id: 'plan_enterprise',
        name: 'ENTERPRISE',
        description: 'Solução ilimitada para grandes redes e franqueadoras.',
        max_students: null, // unlimited
        price: 0, // custom
        featuresList: ['Tudo do PRO', 'Multipropriedade (Redes)', 'Integração API Externa', 'CRM e Relacionamento'],
        allowedFeatures: ['app_aluno', 'chat', 'aulas_coletivas', 'multiplos_agendamentos', 'multiplos_usuarios', 'cobranca_automatizada', 'multipropriedade', 'api_externa'],
        icon: Crown,
    },
}

export const getPlanById = (id: string | null | undefined): BeeGymPlan => {
    if (!id) return BEEGYM_PLANS.plan_starter // Default fallback
    return BEEGYM_PLANS[id] || BEEGYM_PLANS.plan_starter
}
