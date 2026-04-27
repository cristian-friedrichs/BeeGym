/**
 * Centralized server-side environment configuration.
 * All server-side code should import from here instead of
 * accessing process.env.NEXT_PUBLIC_* directly.
 *
 * NEXT_PUBLIC_ prefix is ONLY used in true client-side files
 * (src/lib/supabase/client.ts, admin-login-button.tsx).
 */

// ── Supabase ────────────────────────────────────────────
// Server-side reads without NEXT_PUBLIC_ prefix first, falls back to prefixed
// for backward-compat during migration.
export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ── Kiwify ─────────────────────────────────────────────
// No fallback: webhook returns 503 if not set, preventing accidental open auth.
// Accepts KIWIFY_TOKEN (preferred) or legacy KIWIFY_WEBHOOK_TOKEN.
export const KIWIFY_TOKEN =
  process.env.KIWIFY_TOKEN || process.env.KIWIFY_WEBHOOK_TOKEN || '';

// Fim das variáveis de ambiente
