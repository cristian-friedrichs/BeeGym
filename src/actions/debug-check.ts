'use server';

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env-config';

export async function debugStudentData() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Missing Supabase environment variables' };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { data: students, error } = await supabase
            .from('students')
            .select('id, full_name, plan, objective')
            .limit(5);

        if (error) {
            console.error('Debug Server Action Error:', error);
            return { error: error.message };
        }

        return { data: students };
    } catch (err: any) {
        console.error('Debug Server Action Exception:', err);
        return { error: err.message };
    }
}
