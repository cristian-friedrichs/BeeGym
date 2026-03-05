const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data: planos, error } = await supabase
            .from('saas_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) console.error("Error saas_plans:", error);
        else console.log("saas_plans OK, count:", planos.length);

        const { data: subs, error: subsError } = await supabase
            .from('saas_subscriptions')
            .select('plan_id, status')
            .in('status', ['active', 'trialing']);

        if (subsError) console.error("Error saas_subscriptions:", subsError);
        else console.log("saas_subscriptions OK, count:", subs.length);
    } catch (e) {
        console.error("Catch Exception:", e);
    }
}

test();
