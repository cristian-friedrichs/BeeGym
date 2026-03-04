-- Adicionar ao schema Prisma/Supabase

CREATE TABLE assinaturas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contratante_id      UUID NOT NULL REFERENCES organizations(id),    -- Vinculado a organization (B2B SaaS)
  plano_id            TEXT NOT NULL,                                 -- 'STARTER' | 'PRO' | 'ENTERPRISE'
  metodo              TEXT NOT NULL,                                 -- 'PIX_AUTOMATICO' | 'CARTAO_RECORRENTE'
  status              TEXT NOT NULL DEFAULT 'PENDENTE_CONSENTIMENTO',
  valor_mensal        DECIMAL(10,2) NOT NULL,
  dia_vencimento      SMALLINT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 28),
  proximo_vencimento  DATE,

  -- Pix Automático
  acordo_efi_id       TEXT UNIQUE,

  -- Cartão Recorrente
  subscription_efi_id INTEGER UNIQUE,

  -- Carência
  inicio_carencia     TIMESTAMP,

  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cobrancas_recorrentes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id   UUID NOT NULL REFERENCES assinaturas(id),
  reference_id    TEXT NOT NULL UNIQUE,  -- txid (Pix) ou charge_id (Cartão)
  metodo          TEXT NOT NULL,
  status          TEXT NOT NULL,         -- 'PAGO' | 'FALHA' | 'PENDENTE'
  valor           DECIMAL(10,2) NOT NULL,
  processado_em   TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_assinaturas_contratante ON assinaturas(contratante_id);
CREATE INDEX idx_assinaturas_status ON assinaturas(status);
CREATE INDEX idx_assinaturas_vencimento ON assinaturas(dia_vencimento);
CREATE INDEX idx_cobrancas_reference ON cobrancas_recorrentes(reference_id);
