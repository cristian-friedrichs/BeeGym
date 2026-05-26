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

export interface LeaderMeeting {
    id: string;
    title: string;
    cadence: 'daily' | 'weekly';
    status: 'open' | 'scheduled' | 'closed';
    startedAt: string;
    participants: string[];
    openDecisions: string[];
    blockers: string[];
    nextSteps: string[];
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

export const commandCenterPhaseNotice = 'Dados simulados - Fase 1 do Agent Command Center';

export const departments: AgentDepartment[] = [
    {
        id: 'ceo-command',
        name: 'CEO / Command Center',
        shortName: 'CEO',
        description: 'Prioridades, decisoes sensiveis, riscos e aprovacoes finais.',
        status: 'attention',
        leadAgentId: 'ceo-command-agent',
        healthScore: 86,
        recentTasks: 8,
        pendingApprovals: 4,
        agentIds: ['ceo-command-agent'],
        focus: 'Decisao, risco e foco operacional',
    },
    {
        id: 'cto-monitoring',
        name: 'CTO / TI + Monitoramento',
        shortName: 'CTO',
        description: 'Arquitetura, engenharia, qualidade, seguranca, releases e monitoramento.',
        status: 'attention',
        leadAgentId: 'cto-agent',
        healthScore: 82,
        recentTasks: 14,
        pendingApprovals: 3,
        agentIds: ['cto-agent', 'frontend-agent', 'backend-agent', 'qa-agent', 'watchtower-agent', 'security-agent'],
        focus: 'Estabilidade tecnica e execucao segura',
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
        description: 'Posicionamento, conteudo, campanhas, canais e inteligencia de mercado.',
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
        description: 'Funil, ativacao, conversao, retencao e experimentos.',
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
        description: 'Roadmap, descoberta, criterio de aceite e impacto em jornada.',
        status: 'healthy',
        leadAgentId: 'product-agent',
        healthScore: 84,
        recentTasks: 6,
        pendingApprovals: 1,
        agentIds: ['product-agent'],
        focus: 'Primeiro valor e experiencia do usuario',
    },
    {
        id: 'finance',
        name: 'Financeiro',
        shortName: 'Financeiro',
        description: 'Receita, inadimplencia, billing e excecoes comerciais sob aprovacao.',
        status: 'blocked',
        leadAgentId: 'finance-ops-agent',
        healthScore: 68,
        recentTasks: 4,
        pendingApprovals: 3,
        agentIds: ['finance-ops-agent'],
        focus: 'Risco de receita e aprovacoes comerciais',
    },
];

export const agents: AgentProfile[] = [
    {
        id: 'ceo-command-agent',
        name: 'CEO Command Agent',
        title: 'Orquestrador executivo',
        departmentId: 'ceo-command',
        autonomyLevel: 'Nivel 0-2',
        status: 'watching',
        health: 'attention',
        summary: 'Consolida sinais, decisoes pendentes e riscos entre departamentos.',
        docsPath: 'beegym-operating-system/ceo-command-center.md',
        lastActivityAt: '2026-05-26T08:40:00-03:00',
        allowedActions: ['Diagnosticar prioridades', 'Organizar decisoes', 'Consolidar relatorios'],
        forbiddenActions: ['Aprovar risco sozinho', 'Fazer merge', 'Executar deploy'],
        approvalRequiredActions: ['Autorizar risco alto', 'Publicacao externa', 'Mudanca de oferta publica'],
    },
    {
        id: 'cto-agent',
        name: 'CTO Agent',
        title: 'Lider de TI e monitoramento',
        departmentId: 'cto-monitoring',
        autonomyLevel: 'Nivel 2',
        status: 'active',
        health: 'attention',
        summary: 'Planeja arquitetura, escopo tecnico e divisao de tarefas entre agentes de engenharia.',
        docsPath: 'departments/cto/agents/00-cto-agent.md',
        lastActivityAt: '2026-05-26T08:32:00-03:00',
        allowedActions: ['Planejar tarefas tecnicas', 'Revisar riscos', 'Preparar PRs pequenos'],
        forbiddenActions: ['Tocar em Supabase sem aprovacao', 'Alterar deploy', 'Alterar secrets'],
        approvalRequiredActions: ['Auth', 'Billing', 'Migrations', 'Dependencias', 'Deploy'],
    },
    {
        id: 'frontend-agent',
        name: 'Frontend Agent',
        title: 'UI e fluxos React',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nivel 2',
        status: 'active',
        health: 'healthy',
        summary: 'Implementa interfaces aprovadas, responsividade e validacao visual.',
        docsPath: 'departments/cto/agents/02-frontend-agent.md',
        lastActivityAt: '2026-05-26T08:22:00-03:00',
        allowedActions: ['Criar UI mockada', 'Ajustar componentes visuais', 'Rodar lint e build'],
        forbiddenActions: ['Alterar auth', 'Criar API real', 'Adicionar dependencia'],
        approvalRequiredActions: ['Fluxo sensivel de cliente', 'Tracking real', 'Alteracao de pricing'],
    },
    {
        id: 'backend-agent',
        name: 'Backend Agent',
        title: 'APIs e logica server-side',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nivel 1-2',
        status: 'idle',
        health: 'attention',
        summary: 'Desenha APIs e contratos server-side quando aprovados.',
        docsPath: 'departments/cto/agents/03-backend-agent.md',
        lastActivityAt: '2026-05-26T07:50:00-03:00',
        allowedActions: ['Propor contrato de API', 'Diagnosticar backend', 'Revisar logs seguros'],
        forbiddenActions: ['Criar tabela sem aprovacao', 'Rodar mutacao remota', 'Ler secrets'],
        approvalRequiredActions: ['Nova API de operacao real', 'Supabase', 'Webhooks financeiros'],
    },
    {
        id: 'qa-agent',
        name: 'QA Agent',
        title: 'Validacao e regressao',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nivel 2',
        status: 'watching',
        health: 'healthy',
        summary: 'Define criterios de aceite, valida build e registra falhas com evidencias seguras.',
        docsPath: 'departments/cto/agents/04-qa-agent.md',
        lastActivityAt: '2026-05-26T07:35:00-03:00',
        allowedActions: ['Rodar validacoes locais', 'Classificar falhas', 'Documentar regressao'],
        forbiddenActions: ['Usar credenciais reais', 'Expor artefatos sensiveis', 'Alterar escopo'],
        approvalRequiredActions: ['Teste em ambiente remoto', 'Automacao recorrente', 'Dados reais'],
    },
    {
        id: 'watchtower-agent',
        name: 'Watchtower Agent',
        title: 'Saude sintetica e alertas',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nivel 4 planejado',
        status: 'watching',
        health: 'attention',
        summary: 'Acompanha health checks, classifica incidentes e prepara relatorios.',
        docsPath: 'departments/cto/agents/05-watchtower-agent.md',
        lastActivityAt: '2026-05-26T06:10:00-03:00',
        allowedActions: ['Ler status de checks', 'Classificar incidente', 'Preparar issue'],
        forbiddenActions: ['Corrigir producao sozinho', 'Fazer rollback', 'Criar automacao real sem aprovacao'],
        approvalRequiredActions: ['Acesso remoto', 'Automacao recorrente', 'Rollback'],
    },
    {
        id: 'security-agent',
        name: 'Security Agent',
        title: 'Risco tecnico e seguranca',
        departmentId: 'cto-monitoring',
        parentAgentId: 'cto-agent',
        autonomyLevel: 'Nivel 0-1',
        status: 'idle',
        health: 'healthy',
        summary: 'Revisa riscos de secrets, dados, permissoes e superficies sensiveis.',
        docsPath: 'departments/cto/agents/07-security-agent.md',
        lastActivityAt: '2026-05-25T17:20:00-03:00',
        allowedActions: ['Revisar risco', 'Sugerir mitigacao', 'Auditar escopo de mudanca'],
        forbiddenActions: ['Ler secrets', 'Alterar policies', 'Mudar roles'],
        approvalRequiredActions: ['Auth', 'RLS', 'Secrets', 'Dados reais'],
    },
    {
        id: 'support-orchestrator-agent',
        name: 'Support Orchestrator Agent',
        title: 'Lider de suporte',
        departmentId: 'customer-support',
        autonomyLevel: 'Nivel 1',
        status: 'active',
        health: 'healthy',
        summary: 'Organiza triagem, escalonamento e padroes de resposta para tickets.',
        docsPath: 'departments/customer-support/agents/00-support-orchestrator-agent.md',
        lastActivityAt: '2026-05-26T08:18:00-03:00',
        allowedActions: ['Classificar tickets', 'Sugerir resposta', 'Escalar bug provavel'],
        forbiddenActions: ['Prometer prazo tecnico', 'Executar reembolso', 'Alterar dados reais'],
        approvalRequiredActions: ['Excecao comercial', 'Resposta sensivel', 'Cancelamento especial'],
    },
    {
        id: 'ticket-triage-agent',
        name: 'Ticket Triage Agent',
        title: 'Triagem de tickets',
        departmentId: 'customer-support',
        parentAgentId: 'support-orchestrator-agent',
        autonomyLevel: 'Nivel 1',
        status: 'active',
        health: 'healthy',
        summary: 'Classifica assunto, prioridade e rota de escalonamento.',
        docsPath: 'departments/customer-support/agents/01-ticket-triage-agent.md',
        lastActivityAt: '2026-05-26T08:16:00-03:00',
        allowedActions: ['Categorizar ticket', 'Sugerir macro', 'Identificar bug recorrente'],
        forbiddenActions: ['Alterar status financeiro', 'Responder como humano sem revisao', 'Expor dados'],
        approvalRequiredActions: ['Resposta de incidente', 'Compensacao', 'Escalonamento publico'],
    },
    {
        id: 'billing-support-agent',
        name: 'Billing Support Agent',
        title: 'Suporte de cobranca',
        departmentId: 'customer-support',
        parentAgentId: 'support-orchestrator-agent',
        autonomyLevel: 'Nivel 0-1',
        status: 'watching',
        health: 'attention',
        summary: 'Prepara orientacoes de billing sem executar acoes financeiras.',
        docsPath: 'departments/customer-support/agents/05-billing-support-agent.md',
        lastActivityAt: '2026-05-26T07:44:00-03:00',
        allowedActions: ['Explicar politica', 'Preparar resposta', 'Escalar excecao'],
        forbiddenActions: ['Executar desconto', 'Cancelar assinatura', 'Alterar pagamento'],
        approvalRequiredActions: ['Reembolso', 'Desconto manual', 'Cancelamento excepcional'],
    },
    {
        id: 'cmo-agent',
        name: 'CMO Agent',
        title: 'Lider de marketing',
        departmentId: 'marketing-cmo',
        autonomyLevel: 'Nivel 1',
        status: 'active',
        health: 'healthy',
        summary: 'Coordena posicionamento, campanha, canais e revisao de promessas.',
        docsPath: 'departments/marketing/agents/00-cmo-agent.md',
        lastActivityAt: '2026-05-26T08:05:00-03:00',
        allowedActions: ['Criar briefing', 'Revisar posicionamento', 'Planejar campanha'],
        forbiddenActions: ['Publicar conteudo', 'Comprar midia', 'Inventar prova social'],
        approvalRequiredActions: ['Publicacao externa', 'Promessa comercial', 'Mudanca de oferta'],
    },
    {
        id: 'copywriting-agent',
        name: 'Copywriting Agent',
        title: 'Copy e mensagens',
        departmentId: 'marketing-cmo',
        parentAgentId: 'cmo-agent',
        autonomyLevel: 'Nivel 1',
        status: 'idle',
        health: 'healthy',
        summary: 'Produz rascunhos e variantes de copy para revisao.',
        docsPath: 'departments/marketing/agents/09-copywriting-agent.md',
        lastActivityAt: '2026-05-25T16:10:00-03:00',
        allowedActions: ['Escrever rascunho', 'Gerar variantes', 'Revisar clareza'],
        forbiddenActions: ['Publicar sozinho', 'Prometer resultado garantido', 'Usar prova falsa'],
        approvalRequiredActions: ['Landing page publica', 'Campanha paga', 'Oferta promocional'],
    },
    {
        id: 'performance-marketing-agent',
        name: 'Performance Marketing Agent',
        title: 'Analise de canais',
        departmentId: 'marketing-cmo',
        parentAgentId: 'cmo-agent',
        autonomyLevel: 'Nivel 0-1',
        status: 'idle',
        health: 'attention',
        summary: 'Prepara leitura de campanha e hipoteses de melhoria.',
        docsPath: 'departments/marketing/agents/11-performance-marketing-agent.md',
        lastActivityAt: '2026-05-25T14:45:00-03:00',
        allowedActions: ['Analisar numeros fornecidos', 'Propor experimento', 'Criar briefing'],
        forbiddenActions: ['Comprar midia', 'Alterar pixel', 'Publicar campanha'],
        approvalRequiredActions: ['Orcamento', 'Tracking real', 'Oferta publica'],
    },
    {
        id: 'growth-lead-agent',
        name: 'Growth Lead Agent',
        title: 'Lider de growth',
        departmentId: 'growth',
        autonomyLevel: 'Nivel 1',
        status: 'active',
        health: 'attention',
        summary: 'Prioriza funil, ativacao e experimentos pequenos.',
        docsPath: 'departments/growth/agents/00-growth-lead-agent.md',
        lastActivityAt: '2026-05-26T07:58:00-03:00',
        allowedActions: ['Mapear funil', 'Priorizar hipotese', 'Propor teste'],
        forbiddenActions: ['Criar tracking real', 'Alterar oferta', 'Disparar comunicacao'],
        approvalRequiredActions: ['Experimento real', 'Pricing', 'Automacao de lifecycle'],
    },
    {
        id: 'funnel-analytics-agent',
        name: 'Funnel Analytics Agent',
        title: 'Analise de funil',
        departmentId: 'growth',
        parentAgentId: 'growth-lead-agent',
        autonomyLevel: 'Nivel 0-1',
        status: 'watching',
        health: 'healthy',
        summary: 'Organiza sinais conceituais de aquisicao, ativacao e conversao.',
        docsPath: 'departments/growth/agents/02-funnel-analytics-agent.md',
        lastActivityAt: '2026-05-26T07:42:00-03:00',
        allowedActions: ['Mapear eventos conceituais', 'Analisar dados fornecidos', 'Sugerir metricas'],
        forbiddenActions: ['Criar tracking real', 'Inventar metricas reais', 'Alterar produto'],
        approvalRequiredActions: ['Evento real em producao', 'Integracao analytics', 'Dados reais'],
    },
    {
        id: 'experiment-agent',
        name: 'Experimentation Agent',
        title: 'Experimentos',
        departmentId: 'growth',
        parentAgentId: 'growth-lead-agent',
        autonomyLevel: 'Nivel 1',
        status: 'idle',
        health: 'attention',
        summary: 'Desenha testes pequenos com criterio de sucesso e risco.',
        docsPath: 'departments/growth/agents/05-experimentation-agent.md',
        lastActivityAt: '2026-05-25T15:55:00-03:00',
        allowedActions: ['Criar plano de experimento', 'Definir criterio', 'Listar riscos'],
        forbiddenActions: ['Executar teste real', 'Alterar pricing', 'Publicar variante'],
        approvalRequiredActions: ['Teste em usuario real', 'Oferta', 'Comunicacao externa'],
    },
    {
        id: 'product-agent',
        name: 'Product Agent',
        title: 'Produto e criterio de aceite',
        departmentId: 'product',
        autonomyLevel: 'Nivel 1-2',
        status: 'active',
        health: 'healthy',
        summary: 'Converte objetivo de negocio em escopo de produto revisavel.',
        docsPath: 'skills/development/prd-writing.md',
        lastActivityAt: '2026-05-26T08:12:00-03:00',
        allowedActions: ['Escrever criterio de aceite', 'Mapear jornada', 'Reduzir escopo'],
        forbiddenActions: ['Definir solucao tecnica final sozinho', 'Alterar billing', 'Alterar auth'],
        approvalRequiredActions: ['Comportamento critico', 'Mudanca de plano', 'Fluxo de pagamento'],
    },
    {
        id: 'finance-ops-agent',
        name: 'Finance Ops Agent',
        title: 'Risco financeiro simulado',
        departmentId: 'finance',
        autonomyLevel: 'Nivel 0',
        status: 'blocked',
        health: 'blocked',
        summary: 'Centraliza sinais financeiros, mas nao executa billing real nesta fase.',
        docsPath: 'src/app/admin/(authenticated)/financeiro/page.tsx',
        lastActivityAt: '2026-05-26T07:25:00-03:00',
        allowedActions: ['Sinalizar risco', 'Preparar resumo', 'Pedir aprovacao'],
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
        eventType: 'UI mockada',
        autonomyLevel: 'Nivel 2',
        branchOrPr: 'codex/admin-agent-command-center-mvp',
        status: 'running',
        risk: 'low',
        occurredAt: '2026-05-26T08:42:00-03:00',
        evidence: 'Constants locais e rotas /admin/agentes em preparacao',
    },
    {
        id: 'run-002',
        agentId: 'watchtower-agent',
        departmentId: 'cto-monitoring',
        task: 'Classificar ultimo Synthetic Health Check',
        eventType: 'Health check',
        autonomyLevel: 'Nivel 4 planejado',
        branchOrPr: 'workflow: synthetic-health-check.yml',
        status: 'waiting_approval',
        risk: 'medium',
        occurredAt: '2026-05-26T06:15:00-03:00',
        evidence: 'Relatorio simulado aguardando triagem humana',
    },
    {
        id: 'run-003',
        agentId: 'support-orchestrator-agent',
        departmentId: 'customer-support',
        task: 'Agrupar tickets recorrentes sobre pagamentos',
        eventType: 'Suporte',
        autonomyLevel: 'Nivel 1',
        branchOrPr: 'mock/support-weekly-patterns',
        status: 'completed',
        risk: 'low',
        occurredAt: '2026-05-26T07:58:00-03:00',
        evidence: 'Padroes mockados sem dados reais de cliente',
    },
    {
        id: 'run-004',
        agentId: 'cmo-agent',
        departmentId: 'marketing-cmo',
        task: 'Revisar proposta de campanha para studios',
        eventType: 'Campanha',
        autonomyLevel: 'Nivel 1',
        branchOrPr: 'mock/marketing-studio-campaign',
        status: 'waiting_approval',
        risk: 'medium',
        occurredAt: '2026-05-25T17:50:00-03:00',
        evidence: 'Publicacao externa exige aprovacao CEO',
    },
    {
        id: 'run-005',
        agentId: 'growth-lead-agent',
        departmentId: 'growth',
        task: 'Priorizar experimento de ativacao do trial',
        eventType: 'Growth',
        autonomyLevel: 'Nivel 1',
        branchOrPr: 'mock/growth-trial-activation',
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
        autonomyLevel: 'Nivel 0',
        branchOrPr: 'sem branch',
        status: 'waiting_approval',
        risk: 'high',
        occurredAt: '2026-05-25T15:10:00-03:00',
        evidence: 'Acao financeira bloqueada por matriz de aprovacao',
    },
];

export const agentEvents: AgentEvent[] = [
    {
        id: 'event-001',
        agentId: 'frontend-agent',
        departmentId: 'cto-monitoring',
        runId: 'run-001',
        title: 'UI mockada autorizada para /admin/agentes',
        eventType: 'Implementacao visual',
        severity: 'low',
        status: 'running',
        occurredAt: '2026-05-26T08:42:00-03:00',
        evidence: 'Sem API, sem Supabase, sem mutacao real',
    },
    {
        id: 'event-002',
        agentId: 'watchtower-agent',
        departmentId: 'cto-monitoring',
        runId: 'run-002',
        title: 'Health check sintetico requer leitura de artefato',
        eventType: 'Monitoramento',
        severity: 'medium',
        status: 'waiting_approval',
        occurredAt: '2026-05-26T06:15:00-03:00',
        evidence: 'Link e status sao mockados nesta fase',
    },
    {
        id: 'event-003',
        agentId: 'billing-support-agent',
        departmentId: 'customer-support',
        title: 'Ticket de cobranca marcado como sensivel',
        eventType: 'Aprovacao',
        severity: 'high',
        status: 'waiting_approval',
        occurredAt: '2026-05-26T07:44:00-03:00',
        evidence: 'Sem dados reais e sem acao financeira',
    },
    {
        id: 'event-004',
        agentId: 'product-agent',
        departmentId: 'product',
        title: 'Criterios de aceite para sala de lideres definidos',
        eventType: 'Produto',
        severity: 'low',
        status: 'completed',
        occurredAt: '2026-05-26T08:12:00-03:00',
        evidence: 'Fluxo permanece visual e mockado',
    },
    {
        id: 'event-005',
        agentId: 'security-agent',
        departmentId: 'cto-monitoring',
        title: 'Regra de dados simulados reforcada',
        eventType: 'Seguranca',
        severity: 'low',
        status: 'completed',
        occurredAt: '2026-05-25T17:20:00-03:00',
        evidence: 'Nao usar logs reais, tokens, secrets ou dados de cliente',
    },
];

export const approvalRequests: ApprovalRequest[] = [
    {
        id: 'approval-001',
        action: 'Autorizar leitura de relatorio sintetico completo',
        departmentId: 'cto-monitoring',
        requesterAgentId: 'watchtower-agent',
        riskArea: 'Monitoramento',
        impact: 'Ajuda a classificar falha simulada sem acionar producao.',
        status: 'pending',
        priority: 'medium',
        requestedAt: '2026-05-26T06:20:00-03:00',
        details: 'Aprovacao mockada. Nenhum artefato real sera aberto por este MVP.',
    },
    {
        id: 'approval-002',
        action: 'Revisar proposta de publicacao externa',
        departmentId: 'marketing-cmo',
        requesterAgentId: 'cmo-agent',
        riskArea: 'Publicacao externa',
        impact: 'Evita promessa comercial sem revisao do CEO.',
        status: 'reviewing',
        priority: 'high',
        requestedAt: '2026-05-25T17:52:00-03:00',
        details: 'Publicacao externa permanece bloqueada ate aprovacao real fora deste MVP.',
    },
    {
        id: 'approval-003',
        action: 'Avaliar desconto manual para conta em risco',
        departmentId: 'finance',
        requesterAgentId: 'finance-ops-agent',
        riskArea: 'Billing / pagamentos',
        impact: 'Pode afetar receita e politica comercial.',
        status: 'pending',
        priority: 'critical',
        requestedAt: '2026-05-25T15:15:00-03:00',
        details: 'Acao visual apenas. Nenhum dado financeiro real e nenhuma cobranca foram alterados.',
    },
    {
        id: 'approval-004',
        action: 'Planejar experimento de ativacao com tracking real',
        departmentId: 'growth',
        requesterAgentId: 'growth-lead-agent',
        riskArea: 'Tracking / dados reais',
        impact: 'Exigiria evento real e validacao de privacidade em fase futura.',
        status: 'pending',
        priority: 'high',
        requestedAt: '2026-05-25T16:40:00-03:00',
        details: 'Fase 1 usa apenas hipotese mockada sem integracao analytics.',
    },
    {
        id: 'approval-005',
        action: 'Abrir PR automatico apos push',
        departmentId: 'ceo-command',
        requesterAgentId: 'ceo-command-agent',
        riskArea: 'Governanca de automacao',
        impact: 'Nivel 3 ainda nao esta ativo no BeeGym OS.',
        status: 'pending',
        priority: 'medium',
        requestedAt: '2026-05-25T13:30:00-03:00',
        details: 'Este MVP nao abre PR automaticamente.',
    },
];

export const leaderMeetings: LeaderMeeting[] = [
    {
        id: 'meeting-daily-001',
        title: 'Reuniao diaria de lideres',
        cadence: 'daily',
        status: 'open',
        startedAt: '2026-05-26T08:30:00-03:00',
        participants: ['ceo-command-agent', 'cto-agent', 'support-orchestrator-agent', 'cmo-agent', 'growth-lead-agent', 'product-agent', 'finance-ops-agent'],
        openDecisions: ['Priorizar aprovacoes de billing', 'Confirmar escopo de integracao GitHub Fase 3'],
        blockers: ['Dados reais permanecem bloqueados', 'Nivel 3 ainda nao aprovado'],
        nextSteps: ['Validar MVP visual', 'Separar proposta de schema Fase 2', 'Definir fonte segura dos eventos automaticos'],
    },
    {
        id: 'meeting-weekly-001',
        title: 'Revisao semanal de operacao',
        cadence: 'weekly',
        status: 'scheduled',
        startedAt: '2026-05-29T09:00:00-03:00',
        participants: ['ceo-command-agent', 'cto-agent', 'cmo-agent', 'growth-lead-agent'],
        openDecisions: ['Criticar backlog de aprovacoes', 'Mapear sinais de suporte que viram produto'],
        blockers: ['Sem persistencia de reunioes na Fase 1'],
        nextSteps: ['Preparar relatorio mockado por departamento', 'Listar metricas de Fase 2'],
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
        body: 'Suporte precisa enxergar escalonamentos de billing, mas sem acao financeira automatica.',
        createdAt: '2026-05-26T08:34:00-03:00',
        type: 'blocker',
    },
    {
        id: 'message-003',
        meetingId: 'meeting-daily-001',
        senderAgentId: 'growth-lead-agent',
        departmentId: 'growth',
        body: 'Growth quer registrar hipoteses e aprovacoes antes de qualquer tracking real.',
        createdAt: '2026-05-26T08:36:00-03:00',
        type: 'next_step',
    },
    {
        id: 'message-004',
        meetingId: 'meeting-daily-001',
        senderAgentId: 'ceo-command-agent',
        departmentId: 'ceo-command',
        body: 'Decisao mockada: separar interface, persistencia e integracoes em fases independentes.',
        createdAt: '2026-05-26T08:39:00-03:00',
        type: 'decision',
    },
];

export const mockGithubLinks: MockGithubLink[] = [
    {
        id: 'mock-gh-001',
        label: 'PR #128 - agent command center mock',
        type: 'pr',
        status: 'mockado',
        branch: 'codex/admin-agent-command-center-mvp',
        checksStatus: 'nao executado nesta fixture',
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
        checksStatus: 'falha mockada',
        url: '#',
        linkedAgentId: 'watchtower-agent',
        linkedRunId: 'run-002',
    },
    {
        id: 'mock-gh-003',
        label: 'Action - build (18.x)',
        type: 'action',
        status: 'referencia mockada',
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
