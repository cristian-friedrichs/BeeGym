import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        fetch: (...args: any[]) => {
          return fetch(...args as [any, any]);
        }
      }
    }
  )
}

export const supabase = createClient();
