
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking plans table...');
    const { data: plans, error: plansError } = await supabase.from('plans').select('*').limit(1);
    if (plansError) {
        console.error('Error fetching plans:', plansError.message);
        // Try membership_plans
        console.log('Trying membership_plans...');
        const { data: mPlans, error: mPlansError } = await supabase.from('membership_plans').select('*').limit(1);
        if (mPlansError) {
            console.error('Error fetching membership_plans:', mPlansError.message);
        } else {
            console.log('Found membership_plans:', mPlans);
        }
    } else {
        console.log('Found plans:', plans);
    }

    console.log('Checking profiles table structure...');
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message);
    } else {
        console.log('Found profiles sample:', profiles);
    }
}

checkTables();
