-- Migration: Add payment_token column to saas_subscriptions for PIX payments
-- This column stores the TXID from EFI PIX charges for webhook verification

ALTER TABLE saas_subscriptions
ADD COLUMN IF NOT EXISTS payment_token TEXT;

CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_payment_token ON saas_subscriptions(payment_token);
