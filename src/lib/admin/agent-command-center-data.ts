export type AgentDepartmentStatus = 'healthy' | 'attention' | 'blocked';
export type AgentRunStatus = 'completed' | 'running' | 'waiting_approval' | 'failed';
export type AgentRiskLevel = 'low' | 'medium' | 'high';
export type ApprovalStatus = 'pending' | 'approved_mock' | 'rejected_mock' | 'reviewing';
export type ApprovalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentDepartment {
    id: string;
    name: string;
    shortName: string;
    description: string;
    status: AgentDepartmentStatus;
    leadAgentId: string;
    healthScore: number;
    recentTasks: number;
    pendingApprovals: number;
    agentIds: string[];
    focus: string;
}

export interface AgentProfile {
    id: string;
    name: string;
    title: string;
    departmentId: string;
    parentAgentId?: string;
    autonomyLevel: string;
    status: 'active' | 'idle' | 'watching' | 'blocked';
    health: AgentDepartmentStatus;
    summary: string;
    docsPath: string;
    lastActivityAt: string;
    allowedActions: string[];
    forbiddenActions: string[];
    approvalRequiredActions: string[];
}

export interface AgentRun {
    id: string;
    agentId: string;
    departmentId: string;
    task: string;
    eventType: string;
    autonomyLevel: string;
    branchOrPr: string;
    status: AgentRunStatus;
    risk: AgentRiskLevel;
    occurredAt: string;
    evidence: string;
}

export interface AgentEvent {
    id: string;
    agentId: string;
    departmentId: string;
    runId?: string;
    title: string;
    eventType: string;
    severity: AgentRiskLevel;
    status: AgentRunStatus;
    occurredAt: string;
    evidence: string;
}

export interface ApprovalRequest {
    id: string;
    action: string;
    departmentId: string;
    requesterAgentId: string;
    riskArea: string;
    impact: string;
    status: ApprovalStatus;
    priority: ApprovalPriority;
    requestedAt: string;
    details: string;
}

export interface LeaderMeetingItem {
    id: string;
    title: string;
    ownerAgentId: string;
    status: 'open' | 'blocked' | 'planned' | 'reviewing' | 'done';
    dueAt: string;
}

export interface LeaderMeeting {
    id: string;
    title: string;
    cadence: 'daily' | 'weekly';
    status: 'open' | 'scheduled' | 'closed';
    startedAt: string;
    participants: string[];
    openDecisions: LeaderMeetingItem[];
    blockers: LeaderMeetingItem[];
    nextSteps: LeaderMeetingItem[];
}

export interface LeaderMeetingMessage {
    id: string;
    meetingId: string;
    senderAgentId: string;
    departmentId: string;
    body: string;
    createdAt: string;
    type: 'signal' | 'decision' | 'blocker' | 'next_step';
}

export interface MockGithubLink {
    id: string;
    label: string;
    type: 'pr' | 'issue' | 'action';
    status: string;
    branch: string;
    checksStatus: string;
    url: string;
    linkedAgentId?: string;
    linkedRunId?: string;
}

export const commandCenterPhaseNotice = 'Fase 1 do Agent Command Center · Eventos simulados dos agentes · Nenhuma ação real será executada.';

export const departments: AgentDepartment[] = [
    {
        id: 'ceo-command',
        name: 'CEO / Command Center',
        shortName: 'CEO',
        description: 'Prioridades, decisões sensíveis, riscos e aprovações finais.',
        status: 'attention',
        leadAgentId: 'ceo-command-agent',
        healthScore: 86,
        recentTasks: 8,
        pendingApprovals: 4,
        agentIds: ['ceo-command-agent'],
        focus: 'Decisão, risco e foco operacional',
    },
    {
        id: 'cto-monitoring',
        name: 'CTO / TI + Monitoramento',
        shortName: 'CTO',
        description: 'Arquitetura, engenharia, qualidade, segurança, releases e monitoramento.',
        status: 'attention',
        leadAgentId: 'cto-agent',
        healthScore: 82,
        recentTasks: 14,
        pendingApprovals: 3,
        agentIds: ['cto-agent', 'frontend-agent', 'backend-agent', 'qa-agent', 'watchtower-agent', 'security-agent'],
        focus: 'Estabilidade técnica e execução segura',
    },
    {
        id: 'customer-support',
        name: 'Customer Support',
        shortName: 'Suporte',
        description: 'Triagem de tickets, respostas, base de conhecimento e escalonamentos.',
        status: 'healthy',
        leadAgentId: 'support-orchestrator-agent',
        healthScore: 91,
        recentTasks: 11,
        pendingApprovals: 1,
        agentIds: ['support-orchestrator-agent', 'ticket-triage-agent', 'billing-support-agent'],
        focus: 'Atrito do cliente e escalonamento correto',
    },
    {
        id: 'marketing-cmo',
        name: 'Marketing / CMO',
        shortName: 'Marketing',
        description: 'Posicionamento, conteúdo, campanhas, canais e inteligência de mercado.',
        status: 'healthy',
        leadAgentId: 'cmo-agent',
        healthScore: 88,
        recentTasks: 9,
        pendingApprovals: 2,
        agentIds: ['cmo-agent', 'copywriting-agent', 'performance-marketing-agent'],
        focus: 'Mensagem, campanhas e consistencia de oferta',
    },
    {
        id: 'growth',
        name: 'Growth',
        shortName: 'Growth',
        description: 'Funil, ativação, conversão, retenção e experimentos.',
        status: 'attention',
        leadAgentId: 'growth-lead-agent',
        healthScore: 79,
        recentTasks: 7,
        pendingApprovals: 2,
        agentIds: ['growth-lead-agent', 'funnel-analytics-agent', 'experiment-agent'],
        focus: 'Hipoteses pequenas e aprendizado mensuravel',
    },
    {
        id: 'product',
        name: 'Produto',
        shortName: 'Produto',
        description: 'Roadmap, descoberta, critério de aceite e impacto em jornada.',
        status: 'healthy',
        leadAgentId: 'product-agent',
        healthScore: 84,
        recentTasks: 6,
        pendingApprovals: 1,
        agentIds: ['product-agent'],
        focus: 'Primeiro valor e experiência do usuário',
    },
    {
        id: 'finance',
        name: 'Financeiro',
        shortName: 'Financeiro',
        description: 'Receita, inadimplência, billing e exceções comerciais sob aprovação.',
        status: 'blocked',
        leadAgentId: 'finance-ops-agent',
        healthScore: 68,
        recentTasks: 4,
        pendingApprovals: 3,
        agentIds: ['finance-ops-agent'],
        focus: 'Risco de receita e aprovações comerciais',
    },
];

export const agents: AgentProfile[] = [
    {
        id: 'ceo-command-agent',
        name: 'CEO Command Agent',
        title: 'Orquestrador executivo',
        departmentId: 'ceo-command',
        autonomyLevel: 'Nível 0-2',
        status: 'watching',
        health: 'attention',
        summary: 'Consolida sinais, decisões pendentes e riscos entre departamentos.',
        docsPath: 'beegym-operating-system/ceo-command-center.md',
        lastActivityAt: '2026-05-26T08:40:00-03:00',
        allowedActions: ['Diagnosticar prioridades', 'Organizar decisões', 'Consolidar relatórios'],
        forbiddenActions: ['Aprovar risco sozinho', 'Fazer merge', 'Executar deploy'],
        approvalRequiredActions: ['Autorizar risco alto', 'Publicação externa', 'Mudança de oferta pública'],
    },
    {
        id: 'cto-agent',
        name: 'CTO Agent',
        title: 'Líder de TI e monitoramento',
        departmentId: 'cto-monitoring',
        autonomyLevel: 'Nível 2',
        status: 'active',
        health: 'attention',
        summary: 'Planeja arquitetura, escopo técnico e divisão de tarefas entre agentes de engenharia.',
        docsPath: 'departments/cto/agents/00-cto-agent.md',
        lastActivityAt: '2026-05-26T08:32:00-03:00',
        allowedActions: ['Planejar tarefas técnicas', 'Revisar riscos', 'Preparar PRs pequenos'],
        forbiddenActions: ['Tocar em Supabase sem aprovação', 'Alterar deploy', 'Alterar secrets'],
        approvalRequiredActions: ['Auth', 'Billing', 'Migrations', 'Dependências', 'Deploy'],
    },
    {
        id: 'frontend-agent',
        name: 'Frontend Agent',
        title: 'UI e fluxos React',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nível 2',
        status: 'active',
        health: 'healthy',
        summary: 'Implementa interfaces aprovadas, responsividade e validação visual.',
        docsPath: 'departments/cto/agents/02-frontend-agent.md',
        lastActivityAt: '2026-05-26T08:22:00-03:00',
        allowedActions: ['Criar UI simulada', 'Ajustar componentes visuais', 'Rodar lint e build'],
        forbiddenActions: ['Alterar auth', 'Criar API real', 'Adicionar dependência'],
        approvalRequiredActions: ['Fluxo sensível de cliente', 'Tracking real', 'Alteração de pricing'],
    },
    {
        id: 'backend-agent',
        name: 'Backend Agent',
        title: 'APIs e logica server-side',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nível 1-2',
        status: 'idle',
        health: 'attention',
        summary: 'Desenha APIs e contratos server-side quando aprovados.',
        docsPath: 'departments/cto/agents/03-backend-agent.md',
        lastActivityAt: '2026-05-26T07:50:00-03:00',
        allowedActions: ['Propor contrato de API', 'Diagnosticar backend', 'Revisar logs seguros'],
        forbiddenActions: ['Criar tabela sem aprovação', 'Rodar mutação remota', 'Ler secrets'],
        approvalRequiredActions: ['Nova API de operação real', 'Supabase', 'Webhooks financeiros'],
    },
    {
        id: 'qa-agent',
        name: 'QA Agent',
        title: 'Validação e regressão',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nível 2',
        status: 'watching',
        health: 'healthy',
        summary: 'Define critérios de aceite, valida build e registra falhas com evidências seguras.',
        docsPath: 'departments/cto/agents/04-qa-agent.md',
        lastActivityAt: '2026-05-26T07:35:00-03:00',
        allowedActions: ['Rodar validações locais', 'Classificar falhas', 'Documentar regressão'],
        forbiddenActions: ['Usar credenciais reais', 'Expor artefatos sensíveis', 'Alterar escopo'],
        approvalRequiredActions: ['Teste em ambiente remoto', 'Automação recorrente', 'Dados reais'],
    },
    {
        id: 'watchtower-agent',
        name: 'Watchtower Agent',
        title: 'Saúde sintética e alertas',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nível 4 planejado',
        status: 'watching',
        health: 'attention',
        summary: 'Acompanha health checks, classifica incidentes e prepara relatórios.',
        docsPath: 'departments/cto/agents/05-watchtower-agent.md',
        lastActivityAt: '2026-05-26T06:10:00-03:00',
        allowedActions: ['Ler status de checks', 'Classificar incidente', 'Preparar issue'],
        forbiddenActions: ['Corrigir produção sozinho', 'Fazer rollback', 'Criar automação real sem aprovação'],
        approvalRequiredActions: ['Acesso remoto', 'Automação recorrente', 'Rollback'],
    },
    {
        id: 'security-agent',
        name: 'Security Agent',
        title: 'Risco técnico e segurança',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nível 0-1',
        status: 'idle',
        health: 'healthy',
        summary: 'Revisa riscos de secrets, dados, permissões e superfícies sensíveis.',
        docsPath: 'departments/cto/agents/07-security-agent.md',
        lastActivityAt: '2026-05-25T17:20:00-03:00',
        allowedActions: ['Revisar risco', 'Sugerir mitigação', 'Auditar escopo de mudança'],
        forbiddenActions: ['Ler secrets', 'Alterar policies', 'Mudar roles'],
        approvalRequiredActions: ['Auth', 'RLS', 'Secrets', 'Dados reais'],
    },
    {
        id: 'support-orchestrator-agent',
        name: 'Support Orchestrator Agent',
        title: 'Líder de suporte',
        departmentId: 'customer-support',
        autonomyLevel: 'Nível 1',
        status: 'active',
        health: 'healthy',
        summary: 'Organiza triagem, escalonamento e padrões de resposta para tickets.',
        docsPath: 'departments/customer-support/agents/00-support-orchestrator-agent.md',
        lastActivityAt: '2026-05-26T08:18:00-03:00',
        allowedActions: ['Classificar tickets', 'Sugerir resposta', 'Escalar bug provavel'],
        forbiddenActions: ['Prometer prazo tecnico', 'Executar reembolso', 'Alterar dados reais'],
        approvalRequiredActions: ['Exceção comercial', 'Resposta sensível', 'Cancelamento especial'],
    },
    {
        id: 'ticket-triage-agent',
        name: 'Ticket Triage Agent',
        title: 'Triagem de tickets',
        departmentId: 'customer-support',
        parentAgentId: 'support-orchestrator-agent',
        autonomyLevel: 'Nível 1',
        status: 'active',
        health: 'healthy',
        summary: 'Classifica assunto, prioridade e rota de escalonamento.',
        docsPath: 'departments/customer-support/agents/01-ticket-triage-agent.md',
        lastActivityAt: '2026-05-26T08:16:00-03:00',
        allowedActions: ['Categorizar ticket', 'Sugerir macro', 'Identificar bug recorrente'],
        forbiddenActions: ['Alterar status financeiro', 'Responder como humano sem revisão', 'Expor dados'],
        approvalRequiredActions: ['Resposta de incidente', 'Compensação', 'Escalonamento público'],
    },
    {
        id: 'billing-support-agent',
        name: 'Billing Support Agent',
        title: 'Suporte de cobrança',
        departmentId: 'customer-support',
        parentAgentId: 'support-orchestrator-agent',
        autonomyLevel: 'Nível 0-1',
        status: 'watching',
        health: 'attention',
        summary: 'Prepara orientações de billing sem executar ações financeiras.',
        docsPath: 'departments/customer-support/agents/05-billing-support-agent.md',
        lastActivityAt: '2026-05-26T07:44:00-03:00',
        allowedActions: ['Explicar política', 'Preparar resposta', 'Escalar exceção'],
        forbiddenActions: ['Executar desconto', 'Cancelar assinatura', 'Alterar pagamento'],
        approvalRequiredActions: ['Reembolso', 'Desconto manual', 'Cancelamento excepcional'],
    },
    {
        id: 'cmo-agent',
        name: 'CMO Agent',
        title: 'Líder de marketing',
        departmentId: 'marketing-cmo',
        autonomyLevel: 'Nível 1',
        status: 'active',
        health: 'healthy',
        summary: 'Coordena posicionamento, campanha, canais e revisão de promessas.',
        docsPath: 'departments/marketing/agents/00-cmo-agent.md',
        lastActivityAt: '2026-05-26T08:05:00-03:00',
        allowedActions: ['Criar briefing', 'Revisar posicionamento', 'Planejar campanha'],
        forbiddenActions: ['Publicar conteúdo', 'Comprar mídia', 'Inventar prova social'],
        approvalRequiredActions: ['Publicação externa', 'Promessa comercial', 'Mudança de oferta'],
    },
    {
        id: 'copywriting-agent',
        name: 'Copywriting Agent',
        title: 'Copy e mensagens',
        departmentId: 'marketing-cmo',
        parentAgentId: 'cmo-agent',
        autonomyLevel: 'Nível 1',
        status: 'idle',
        health: 'healthy',
        summary: 'Produz rascunhos e variantes de copy para revisão.',
        docsPath: 'departments/marketing/agents/09-copywriting-agent.md',
        lastActivityAt: '2026-05-25T16:10:00-03:00',
        allowedActions: ['Escrever rascunho', 'Gerar variantes', 'Revisar clareza'],
        forbiddenActions: ['Publicar sozinho', 'Prometer resultado garantido', 'Usar prova falsa'],
        approvalRequiredActions: ['Landing page pública', 'Campanha paga', 'Oferta promocional'],
    },
    {
        id: 'performance-marketing-agent',
        name: 'Performance Marketing Agent',
        title: 'Análise de canais',
        departmentId: 'marketing-cmo',
        parentAgentId: 'cmo-agent',
        autonomyLevel: 'Nível 0-1',
        status: 'idle',
        health: 'attention',
        summary: 'Prepara leitura de campanha e hipóteses de melhoria.',
        docsPath: 'departments/marketing/agents/11-performance-marketing-agent.md',
        lastActivityAt: '2026-05-25T14:45:00-03:00',
        allowedActions: ['Analisar numeros fornecidos', 'Propor experimento', 'Criar briefing'],
        forbiddenActions: ['Comprar mídia', 'Alterar pixel', 'Publicar campanha'],
        approvalRequiredActions: ['Orçamento', 'Tracking real', 'Oferta pública'],
    },
    {
        id: 'growth-lead-agent',
        name: 'Growth Lead Agent',
        title: 'Líder de growth',
        departmentId: 'growth',
        autonomyLevel: 'Nível 1',
        status: 'active',
        health: 'attention',
        summary: 'Prioriza funil, ativação e experimentos pequenos.',
        docsPath: 'departments/growth/agents/00-growth-lead-agent.md',
        lastActivityAt: '2026-05-26T07:58:00-03:00',
        allowedActions: ['Mapear funil', 'Priorizar hipótese', 'Propor teste'],
        forbiddenActions: ['Criar tracking real', 'Alterar oferta', 'Disparar comunicação'],
        approvalRequiredActions: ['Experimento real', 'Pricing', 'Automação de lifecycle'],
    },
    {
        id: 'funnel-analytics-agent',
        name: 'Funnel Analytics Agent',
        title: 'Análise de funil',
        departmentId: 'growth',
        parentAgentId: 'growth-lead-agent',
        autonomyLevel: 'Nível 0-1',
        status: 'watching',
        health: 'healthy',
        summary: 'Organiza sinais conceituais de aquisição, ativação e conversão.',
        docsPath: 'departments/growth/agents/02-funnel-analytics-agent.md',
        lastActivityAt: '2026-05-26T07:42:00-03:00',
        allowedActions: ['Mapear eventos conceituais', 'Analisar dados fornecidos', 'Sugerir métricas'],
        forbiddenActions: ['Criar tracking real', 'Inventar métricas reais', 'Alterar produto'],
        approvalRequiredActions: ['Evento real em produção', 'Integração analytics', 'Dados reais'],
    },
    {
        id: 'experiment-agent',
        name: 'Experimentation Agent',
        title: 'Experimentos',
        departmentId: 'growth',
        parentAgentId: 'growth-lead-agent',
        autonomyLevel: 'Nível 1',
        status: 'idle',
        health: 'attention',
        summary: 'Desenha testes pequenos com critério de sucesso e risco.',
        docsPath: 'departments/growth/agents/05-experimentation-agent.md',
        lastActivityAt: '2026-05-25T15:55:00-03:00',
        allowedActions: ['Criar plano de experimento', 'Definir critério', 'Listar riscos'],
        forbiddenActions: ['Executar teste real', 'Alterar pricing', 'Publicar variante'],
        approvalRequiredActions: ['Teste em usuário real', 'Oferta', 'Comunicação externa'],
    },
    {
        id: 'product-agent',
        name: 'Product Agent',
        title: 'Produto e critério de aceite',
        departmentId: 'product',
        autonomyLevel: 'Nível 1-2',
        status: 'active',
        health: 'healthy',
        summary: 'Converte objetivo de negócio em escopo de produto revisável.',
        docsPath: 'skills/development/prd-writing.md',
        lastActivityAt: '2026-05-26T08:12:00-03:00',
        allowedActions: ['Escrever critério de aceite', 'Mapear jornada', 'Reduzir escopo'],
        forbiddenActions: ['Definir solução técnica final sozinho', 'Alterar billing', 'Alterar auth'],
        approvalRequiredActions: ['Comportamento crítico', 'Mudança de plano', 'Fluxo de pagamento'],
    },
    {
        id: 'finance-ops-agent',
        name: 'Finance Ops Agent',
        title: 'Risco financeiro simulado',
        departmentId: 'finance',
        autonomyLevel: 'Nível 0',
        status: 'blocked',
        health: 'blocked',
        summary: 'Centraliza sinais financeiros, mas não executa billing real nesta fase.',
        docsPath: 'src/app/admin/(authenticated)/financeiro/page.tsx',
        lastActivityAt: '2026-05-26T07:25:00-03:00',
        allowedActions: ['Sinalizar risco', 'Preparar resumo', 'Pedir aprovação'],
        forbiddenActions: ['Alterar cobranca', 'Executar reembolso', 'Mudar assinatura'],
        approvalRequiredActions: ['Desconto', 'Reembolso', 'Cancelamento', 'Billing'],
    },
];

export const agentRuns: AgentRun[] = [
    {
        id: 'run-001',
        agentId: 'frontend-agent',
        departmentId: 'cto-monitoring',
        task: 'Prototipar Agent Command Center visual',
        eventType: 'UI simulada',
        autonomyLevel: 'Nível 2',
        branchOrPr: 'codex/admin-agent-command-center-mvp',
        status: 'running',
        risk: 'low',
        occurredAt: '2026-05-26T08:42:00-03:00',
        evidence: 'Constants locais e rotas /admin/agentes em preparação',
    },
    {
        id: 'run-002',
        agentId: 'watchtower-agent',
        departmentId: 'cto-monitoring',
        task: 'Classificar ultimo Synthetic Health Check',
        eventType: 'Health check',
        autonomyLevel: 'Nível 4 planejado',
        branchOrPr: 'workflow: synthetic-health-check.yml',
        status: 'waiting_approval',
        risk: 'medium',
        occurredAt: '2026-05-26T06:15:00-03:00',
        evidence: 'Relatório simulado aguardando triagem humana',
    },
    {
        id: 'run-003',
        agentId: 'support-orchestrator-agent',
        departmentId: 'customer-support',
        task: 'Agrupar tickets recorrentes sobre pagamentos',
        eventType: 'Suporte',
        autonomyLevel: 'Nível 1',
        branchOrPr: 'simulado/support-weekly-patterns',
        status: 'completed',
        risk: 'low',
        occurredAt: '2026-05-26T07:58:00-03:00',
        evidence: 'Padrões simulados sem dados reais de cliente',
    },
    {
        id: 'run-004',
        agentId: 'cmo-agent',
        departmentId: 'marketing-cmo',
        task: 'Revisar proposta de campanha para studios',
        eventType: 'Campanha',
        autonomyLevel: 'Nível 1',
        branchOrPr: 'simulado/marketing-studio-campaign',
        status: 'waiting_approval',
        risk: 'medium',
        occurredAt: '2026-05-25T17:50:00-03:00',
        evidence: 'Publicação externa exige aprovação CEO',
    },
    {
        id: 'run-005',
        agentId: 'growth-lead-agent',
        departmentId: 'growth',
        task: 'Priorizar experimento de ativação do trial',
        eventType: 'Growth',
        autonomyLevel: 'Nível 1',
        branchOrPr: 'simulado/growth-trial-activation',
        status: 'completed',
        risk: 'medium',
        occurredAt: '2026-05-25T16:35:00-03:00',
        evidence: 'Experimento permanece conceitual nesta fase',
    },
    {
        id: 'run-006',
        agentId: 'finance-ops-agent',
        departmentId: 'finance',
        task: 'Sinalizar desconto manual solicitado',
        eventType: 'Billing',
        autonomyLevel: 'Nível 0',
        branchOrPr: 'sem branch',
        status: 'waiting_approval',
        risk: 'high',
        occurredAt: '2026-05-25T15:10:00-03:00',
        evidence: 'Ação financeira bloqueada por matriz de aprovação',
    },
];

export const agentEvents: AgentEvent[] = [
    {
        id: 'event-001',
        agentId: 'frontend-agent',
        departmentId: 'cto-monitoring',
        runId: 'run-001',
        title: 'UI simulada autorizada para /admin/agentes',
        eventType: 'Implementação visual',
        severity: 'low',
        status: 'running',
        occurredAt: '2026-05-26T08:42:00-03:00',
        evidence: 'Sem API, sem Supabase, sem mutação real',
    },
    {
        id: 'event-002',
        agentId: 'watchtower-agent',
        departmentId: 'cto-monitoring',
        runId: 'run-002',
        title: 'Health check sintético requer leitura de artefato',
        eventType: 'Monitoramento',
        severity: 'medium',
        status: 'waiting_approval',
        occurredAt: '2026-05-26T06:15:00-03:00',
        evidence: 'Link e status são simulados nesta fase',
    },
    {
        id: 'event-003',
        agentId: 'billing-support-agent',
        departmentId: 'customer-support',
        title: 'Ticket de cobrança marcado como sensível',
        eventType: 'Aprovação',
        severity: 'high',
        status: 'waiting_approval',
        occurredAt: '2026-05-26T07:44:00-03:00',
        evidence: 'Sem dados reais e sem ação financeira',
    },
    {
        id: 'event-004',
        agentId: 'product-agent',
        departmentId: 'product',
        title: 'Critérios de aceite para sala de líderes definidos',
        eventType: 'Produto',
        severity: 'low',
        status: 'completed',
        occurredAt: '2026-05-26T08:12:00-03:00',
        evidence: 'Fluxo permanece visual e simulado',
    },
    {
        id: 'event-005',
        agentId: 'security-agent',
        departmentId: 'cto-monitoring',
        title: 'Regra de dados simulados reforçada',
        eventType: 'Segurança',
        severity: 'low',
        status: 'completed',
        occurredAt: '2026-05-25T17:20:00-03:00',
        evidence: 'Não usar logs reais, tokens, secrets ou dados de cliente',
    },
];

export const approvalRequests: ApprovalRequest[] = [
    {
        id: 'approval-001',
        action: 'Autorizar leitura de relatório sintético completo',
        departmentId: 'cto-monitoring',
        requesterAgentId: 'watchtower-agent',
        riskArea: 'Monitoramento',
        impact: 'Ajuda a classificar falha simulada sem acionar produção.',
        status: 'pending',
        priority: 'medium',
        requestedAt: '2026-05-26T06:20:00-03:00',
        details: 'Aprovação simulada. Nenhum artefato real será aberto por este MVP.',
    },
    {
        id: 'approval-002',
        action: 'Revisar proposta de publicação externa',
        departmentId: 'marketing-cmo',
        requesterAgentId: 'cmo-agent',
        riskArea: 'Publicação externa',
        impact: 'Evita promessa comercial sem revisão do CEO.',
        status: 'reviewing',
        priority: 'high',
        requestedAt: '2026-05-25T17:52:00-03:00',
        details: 'Publicação externa permanece bloqueada até aprovação real fora deste MVP.',
    },
    {
        id: 'approval-003',
        action: 'Avaliar desconto manual para conta em risco',
        departmentId: 'finance',
        requesterAgentId: 'finance-ops-agent',
        riskArea: 'Billing / pagamentos',
        impact: 'Pode afetar receita e política comercial.',
        status: 'pending',
        priority: 'critical',
        requestedAt: '2026-05-25T15:15:00-03:00',
        details: 'Ação visual apenas. Nenhum dado financeiro real e nenhuma cobrança foram alterados.',
    },
    {
        id: 'approval-004',
        action: 'Planejar experimento de ativação com tracking real',
        departmentId: 'growth',
        requesterAgentId: 'growth-lead-agent',
        riskArea: 'Tracking / dados reais',
        impact: 'Exigiria evento real e validação de privacidade em fase futura.',
        status: 'pending',
        priority: 'high',
        requestedAt: '2026-05-25T16:40:00-03:00',
        details: 'Fase 1 usa apenas hipótese simulada sem integração analytics.',
    },
    {
        id: 'approval-005',
        action: 'Abrir PR automático após push',
        departmentId: 'ceo-command',
        requesterAgentId: 'ceo-command-agent',
        riskArea: 'Governança de automação',
        impact: 'Nível 3 ainda não está ativo no BeeGym OS.',
        status: 'pending',
        priority: 'medium',
        requestedAt: '2026-05-25T13:30:00-03:00',
        details: 'Este MVP não abre PR automaticamente.',
    },
];

export const leaderMeetings: LeaderMeeting[] = [
    {
        id: 'meeting-daily-001',
        title: 'Reunião diária de líderes',
        cadence: 'daily',
        status: 'open',
        startedAt: '2026-05-26T08:30:00-03:00',
        participants: ['ceo-command-agent', 'cto-agent', 'support-orchestrator-agent', 'cmo-agent', 'growth-lead-agent', 'product-agent', 'finance-ops-agent'],
        openDecisions: [
            {
                id: 'decision-001',
                title: 'Priorizar aprovações de billing',
                ownerAgentId: 'finance-ops-agent',
                status: 'reviewing',
                dueAt: '2026-05-26T17:00:00-03:00',
            },
            {
                id: 'decision-002',
                title: 'Confirmar escopo de integração GitHub na Fase 3',
                ownerAgentId: 'cto-agent',
                status: 'open',
                dueAt: '2026-05-27T10:00:00-03:00',
            },
        ],
        blockers: [
            {
                id: 'blocker-001',
                title: 'Dados reais permanecem bloqueados',
                ownerAgentId: 'security-agent',
                status: 'blocked',
                dueAt: '2026-05-27T12:00:00-03:00',
            },
            {
                id: 'blocker-002',
                title: 'Nível 3 ainda não aprovado',
                ownerAgentId: 'ceo-command-agent',
                status: 'blocked',
                dueAt: '2026-05-28T09:00:00-03:00',
            },
        ],
        nextSteps: [
            {
                id: 'next-001',
                title: 'Validar MVP visual',
                ownerAgentId: 'frontend-agent',
                status: 'planned',
                dueAt: '2026-05-26T18:00:00-03:00',
            },
            {
                id: 'next-002',
                title: 'Separar proposta de schema da Fase 2',
                ownerAgentId: 'backend-agent',
                status: 'open',
                dueAt: '2026-05-28T11:00:00-03:00',
            },
            {
                id: 'next-003',
                title: 'Definir fonte segura dos eventos automáticos',
                ownerAgentId: 'watchtower-agent',
                status: 'reviewing',
                dueAt: '2026-05-29T09:30:00-03:00',
            },
        ],
    },
    {
        id: 'meeting-weekly-001',
        title: 'Revisão semanal de operação',
        cadence: 'weekly',
        status: 'scheduled',
        startedAt: '2026-05-29T09:00:00-03:00',
        participants: ['ceo-command-agent', 'cto-agent', 'cmo-agent', 'growth-lead-agent'],
        openDecisions: [
            {
                id: 'decision-003',
                title: 'Criticar backlog de aprovações',
                ownerAgentId: 'ceo-command-agent',
                status: 'planned',
                dueAt: '2026-05-29T12:00:00-03:00',
            },
            {
                id: 'decision-004',
                title: 'Mapear sinais de suporte que viram produto',
                ownerAgentId: 'product-agent',
                status: 'open',
                dueAt: '2026-05-29T15:00:00-03:00',
            },
        ],
        blockers: [
            {
                id: 'blocker-003',
                title: 'Sem persistência de reuniões na Fase 1',
                ownerAgentId: 'backend-agent',
                status: 'blocked',
                dueAt: '2026-05-30T10:00:00-03:00',
            },
        ],
        nextSteps: [
            {
                id: 'next-004',
                title: 'Preparar relatório simulado por departamento',
                ownerAgentId: 'ceo-command-agent',
                status: 'planned',
                dueAt: '2026-05-29T16:00:00-03:00',
            },
            {
                id: 'next-005',
                title: 'Listar métricas da Fase 2',
                ownerAgentId: 'growth-lead-agent',
                status: 'open',
                dueAt: '2026-05-30T11:00:00-03:00',
            },
        ],
    },
];

export const meetingMessages: LeaderMeetingMessage[] = [
    {
        id: 'message-001',
        meetingId: 'meeting-daily-001',
        senderAgentId: 'cto-agent',
        departmentId: 'cto-monitoring',
        body: 'TI recomenda manter a Fase 1 somente visual para evitar acoplamento com Supabase antes do modelo.',
        createdAt: '2026-05-26T08:31:00-03:00',
        type: 'signal',
    },
    {
        id: 'message-002',
        meetingId: 'meeting-daily-001',
        senderAgentId: 'support-orchestrator-agent',
        departmentId: 'customer-support',
        body: 'Suporte precisa enxergar escalonamentos de billing, mas sem ação financeira automática.',
        createdAt: '2026-05-26T08:34:00-03:00',
        type: 'blocker',
    },
    {
        id: 'message-003',
        meetingId: 'meeting-daily-001',
        senderAgentId: 'growth-lead-agent',
        departmentId: 'growth',
        body: 'Growth quer registrar hipóteses e aprovações antes de qualquer tracking real.',
        createdAt: '2026-05-26T08:36:00-03:00',
        type: 'next_step',
    },
    {
        id: 'message-004',
        meetingId: 'meeting-daily-001',
        senderAgentId: 'ceo-command-agent',
        departmentId: 'ceo-command',
        body: 'Decisão simulada: separar interface, persistência e integrações em fases independentes.',
        createdAt: '2026-05-26T08:39:00-03:00',
        type: 'decision',
    },
];

export const mockGithubLinks: MockGithubLink[] = [
    {
        id: 'mock-gh-001',
        label: 'PR #128 - agent command center simulado',
        type: 'pr',
        status: 'simulado',
        branch: 'codex/admin-agent-command-center-mvp',
        checksStatus: 'não executado nesta fixture',
        url: '#',
        linkedAgentId: 'frontend-agent',
        linkedRunId: 'run-001',
    },
    {
        id: 'mock-gh-002',
        label: 'Issue #41 - synthetic health check failed',
        type: 'issue',
        status: 'simulado',
        branch: 'main',
        checksStatus: 'falha simulada',
        url: '#',
        linkedAgentId: 'watchtower-agent',
        linkedRunId: 'run-002',
    },
    {
        id: 'mock-gh-003',
        label: 'Action - build (18.x)',
        type: 'action',
        status: 'referência simulada',
        branch: 'pull_request',
        checksStatus: 'em risco simulado',
        url: '#',
        linkedAgentId: 'qa-agent',
    },
];

export function getDepartment(departmentId: string) {
    return departments.find((department) => department.id === departmentId);
}

export function getAgent(agentId: string) {
    return agents.find((agent) => agent.id === agentId);
}

export function getAgentsByDepartment(departmentId: string) {
    return agents.filter((agent) => agent.departmentId === departmentId);
}

export function getRunsByAgent(agentId: string) {
    return agentRuns.filter((run) => run.agentId === agentId);
}

export function getEventsByAgent(agentId: string) {
    return agentEvents.filter((event) => event.agentId === agentId);
}

export function getApprovalsByAgent(agentId: string) {
    return approvalRequests.filter((approval) => approval.requesterAgentId === agentId);
}

export function getGithubLinksByAgent(agentId: string) {
    return mockGithubLinks.filter((link) => link.linkedAgentId === agentId);
}

export function formatMockDate(iso: string) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}
