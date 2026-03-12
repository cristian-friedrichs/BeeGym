import { Zap, Smartphone, BarChart3, Users, Shield, Headphones, Globe, MessageSquare } from 'lucide-react';

export interface PlanFeature {
    name: string;
    description: string;
    icon: any;
    includedTiers: string[]; // Tiers that have this feature
    value?: (tier: string) => string; // Optional value display (like "Até 20 alunos")
}

export const MARKETING_FEATURES: PlanFeature[] = [
    {
        name: "Alunos Ativos",
        description: "Quantidade de alunos que podem estar cadastrados simultaneamente.",
        icon: Users,
        includedTiers: ["STARTER", "PLUS", "STUDIO", "PRO", "ENTERPRISE", "CUSTOM"],
        value: (tier) => {
            if (tier === 'STARTER') return "Até 20";
            if (tier === 'PLUS') return "Até 40";
            if (tier === 'STUDIO') return "Até 100";
            if (tier === 'PRO') return "Até 500";
            return "Ilimitado";
        }
    },
    {
        name: "Prescrição de Treinos",
        description: "Criação e envio de treinos digitais.",
        icon: Zap,
        includedTiers: ["STARTER", "PLUS", "STUDIO", "PRO", "ENTERPRISE", "CUSTOM"]
    },
    {
        name: "App do Aluno",
        description: "Acesso exclusivo para seu aluno ver treinos e evoluções.",
        icon: Smartphone,
        includedTiers: ["PLUS", "STUDIO", "PRO", "ENTERPRISE", "CUSTOM"]
    },
    {
        name: "Gestão Financeira",
        description: "Controle de mensalidades e recebimentos.",
        icon: BarChart3,
        includedTiers: ["STARTER", "PLUS", "STUDIO", "PRO", "ENTERPRISE", "CUSTOM"]
    },
    {
        name: "Lembretes WhatsApp",
        description: "Envio automático de lembretes de treino e cobrança.",
        icon: MessageSquare,
        includedTiers: ["STUDIO", "PRO", "ENTERPRISE", "CUSTOM"]
    },
    {
        name: "Gestão de Equipe",
        description: "Cadastro de múltiplos professores e funcionários.",
        icon: Shield,
        includedTiers: ["PRO", "ENTERPRISE", "CUSTOM"]
    },
    {
        name: "Suporte Prioritário",
        description: "Atendimento preferencial por nossa equipe.",
        icon: Headphones,
        includedTiers: ["PRO", "ENTERPRISE", "CUSTOM"]
    },
    {
        name: "White-label / Domínio Próprio",
        description: "Sua marca, seu domínio, sua identidade.",
        icon: Globe,
        includedTiers: ["ENTERPRISE", "CUSTOM"]
    }
];

export const MODULE_TO_MARKETING: Record<string, { name: string; description: string; upcoming?: boolean }> = {
    'painel': { name: 'Painel de Gestão', description: 'Visão geral do seu negócio em tempo real.' },
    'agenda': { name: 'Agenda Inteligente', description: 'Agendamentos simplificados e visualização diária/semanal.' },
    'aulas': { name: 'Aulas Coletivas', description: 'Crie turmas, controle capacidade e presença.' },
    'treinos': { name: 'Prescrição de Treinos', description: 'Envie treinos personalizados diretamente ao aluno.' },
    'alunos': { name: 'Gestão de Alunos', description: 'Cadastro completo, histórico e controle de status.' },
    'conversas': { name: 'Chat Integrado', description: 'Comunique-se com seus alunos sem sair do app.' },
    'pagamentos': { name: 'Gestão Financeira', description: 'Controle de mensalidades, faturas e fluxo de caixa.' },
    'exercicios': { name: 'Biblioteca de Exercícios', description: 'Biblioteca pronta com vídeos e possibilidade de personalizar.' },
    'relatorios': { name: 'Relatórios & BI', description: 'Análise de crescimento, churn e faturamento.' },
    'configuracoes': { name: 'Configurações Avançadas', description: 'Personalize horários, cores e sua marca.' },
    'app_aluno': { name: 'App do Aluno', description: 'Seu aluno vê treinos, evoluções e faz agendamentos.', upcoming: true },
    'crm': { name: 'CRM de Vendas', description: 'Funil de vendas para converter visitantes em alunos.', upcoming: true },
    'automacao_cobranca': { name: 'Automação de Cobrança', description: 'Envio automático de links de pagamento e cobrança via WhatsApp.', upcoming: true },
    'api_acesso': { name: 'Controle de Acesso', description: 'Integração com catracas e biometria.', upcoming: true },
    'alertas': { name: 'Alertas WhatsApp', description: 'Notificações de vencimento e novidades automáticas.', upcoming: true },
    'multiplos_agendamentos': { name: 'Múltiplos Agendamentos', description: 'Permita que o aluno agende várias aulas de uma só vez.' },
    'multiplos_usuarios': { name: 'Múltiplos Usuários', description: 'Acesse o sistema com sua equipe, cada um com seu papel.' },
    'multipropriedade': { name: 'Multinunidades', description: 'Gerencie várias unidades ou franquias no mesmo painel.', upcoming: true },
    'api_externa': { name: 'API Externa', description: 'Integre o BeeGym com outras ferramentas favoritas.', upcoming: true },
    'suporte_prioritario': { name: 'Suporte Prioritário', description: 'Atendimento prioritário pela nossa equipe de sucesso.' },
    'white_label': { name: 'Domínio / White-label', description: 'Seu próprio domínio e marca em evidência no sistema.' },
};

export function getFeaturesForTier(tier: string, allowedFeatures?: string[]) {
    if (allowedFeatures && allowedFeatures.length > 0) {
        return allowedFeatures
            .map(f => MODULE_TO_MARKETING[f])
            .filter(Boolean);
    }

    // Fallback original por tier (legado/segurança)
    return MARKETING_FEATURES
        .filter(f => f.includedTiers.includes(tier))
        .map(f => ({ name: f.name }));
}
