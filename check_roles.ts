
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    console.log('Checking app_roles table...');
    const { data: roles, error } = await supabase.from('app_roles').select('*');
    if (error) {
        console.error('Error fetching roles:', error.message);
    } else {
        console.log('Found roles:', roles);
    }
}

checkRoles();
