-- Migration: Enable RLS read access for organizations on their saas_subscriptions
-- Created to fix issue where frontend could not read subscription data, defaulting to Starter

CREATE POLICY "Organizations can view their own subscriptions"
ON saas_subscriptions
FOR SELECT
USING (
  organization_id = auth_user_org_id()
);
