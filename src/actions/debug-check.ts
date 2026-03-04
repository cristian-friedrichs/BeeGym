'use server';

import { createClient } from '@supabase/supabase-js';

export async function debugStudentData() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: 'Missing Supabase environment variables' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
