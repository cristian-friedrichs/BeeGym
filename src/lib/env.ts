/**
 * Valida variáveis de ambiente obrigatórias
 * Lança erro se alguma estiver faltando ou mal formatada
 */
export function validateEnv() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
    ] as const;

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `❌ Critical Error: Missing required environment variables: ${missing.join(', ')}\n` +
            `Please check your .env file and ensure all required variables are set.`
        );
    }

    // Validar formato das URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        throw new Error('❌ Configuration Error: NEXT_PUBLIC_SUPABASE_URL must start with https://');
    }
}

// Auto-validar em development para feedback rápido
if (process.env.NODE_ENV !== 'production') {
    try {
        validateEnv();
    } catch (e: any) {
        console.error(e.message);
    }
}
