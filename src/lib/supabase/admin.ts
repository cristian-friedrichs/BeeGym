import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env-config';

if (!SUPABASE_URL) {
  throw new Error('Missing env.SUPABASE_URL');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Admin actions will fail.');
}

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
