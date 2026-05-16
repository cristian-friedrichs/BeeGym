ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS welcome_seen_at TIMESTAMPTZ NULL;

UPDATE public.organizations
SET welcome_seen_at = NOW()
WHERE welcome_seen_at IS NULL;
