/**
 * Validates required environment variables.
 * Throws if any are missing or malformed.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env-config';

export function validateEnv() {
    const checks: Array<[string, string]> = [
        ['SUPABASE_URL', SUPABASE_URL],
        ['SUPABASE_ANON_KEY', SUPABASE_ANON_KEY],
        ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
    ];

    const missing = checks.filter(([, val]) => !val).map(([name]) => name);

    if (missing.length > 0) {
        throw new Error(
            `❌ Critical Error: Missing required environment variables: ${missing.join(', ')}\n` +
            `Please check your .env file and ensure all required variables are set.`
        );
    }

    if (SUPABASE_URL && !SUPABASE_URL.startsWith('https://')) {
        throw new Error('❌ Configuration Error: SUPABASE_URL must start with https://');
    }
}

// Auto-validate in development for rapid feedback
if (process.env.NODE_ENV !== 'production') {
    try {
        validateEnv();
    } catch (e: any) {
        console.error(e.message);
    }
}
