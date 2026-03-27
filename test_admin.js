const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing organizations query...');
    const { data: orgs, error: orgErr } = await supabase.from('organizations').select('*').limit(1);
    if (orgErr) console.error('orgs error:', orgErr);
    else console.log('orgs ok');

    console.log('Testing subscriptions query...');
    const { data: subs, error: subErr } = await supabase
        .from('saas_subscriptions')
        .select(`
            *,
            saas_plans!saas_plan_id ( name, tier, price )
        `).limit(1);
    
    if (subErr) console.error('subs error:', subErr);
    else console.log('subs ok');
}

test();
