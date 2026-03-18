require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function activatePending() {
    console.log('Buscando contas AGUARDANDO_PAGAMENTO...');
    
    const { data: subs, error } = await supabase
        .from('saas_subscriptions')
        .select('id, organization_id, status')
        .eq('status', 'AGUARDANDO_PAGAMENTO');
        
    if (error) {
        console.error('Erro ao buscar:', error);
        process.exit(1);
    }
    
    if (!subs || subs.length === 0) {
        console.log('Nenhuma conta pendente encontrada.');
        return;
    }
    
    console.log(`Encontradas ${subs.length} contas pendentes. Ativando...`);
    
    for (const sub of subs) {
        console.log(`Ativando sub: ${sub.id} (org: ${sub.organization_id})`);
        
        // 1. saas_subscriptions
        await supabase
            .from('saas_subscriptions')
            .update({ status: 'ATIVO', updated_at: new Date().toISOString() })
            .eq('id', sub.id);
            
        // 2. organizations
        await supabase
            .from('organizations')
            .update({ subscription_status: 'ativo', updated_at: new Date().toISOString() })
            .eq('id', sub.organization_id);
            
        // 3. profiles
        await supabase
            .from('profiles')
            .update({ status: 'ACTIVE' })
            .eq('organization_id', sub.organization_id);
    }
    
    console.log('Todas as contas pendentes foram ativadas com sucesso!');
}

activatePending().catch(console.error);
