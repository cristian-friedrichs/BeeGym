-- Create saas_charges table
CREATE TABLE saas_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    saas_subscription_id UUID NOT NULL REFERENCES saas_subscriptions(id) ON DELETE CASCADE,
    charge_efi_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PAGO', 'FALHA', 'PENDENTE')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('PIX_AUTOMATICO', 'CARTAO_RECORRENTE')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS Policies
ALTER TABLE saas_charges ENABLE ROW LEVEL SECURITY;

-- Admins and Service Roles can do everything bypass RLS
CREATE POLICY "Admins can view and manage all charges" ON saas_charges
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'BEEGYM_ADMIN'
        )
    );

-- Organizations can view their own charges
CREATE POLICY "Organizations can view their own charges" ON saas_charges
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX idx_saas_charges_org_id ON saas_charges(organization_id);
CREATE INDEX idx_saas_charges_sub_id ON saas_charges(saas_subscription_id);
