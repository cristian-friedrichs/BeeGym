import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { KIWIFY_TOKEN } from '@/lib/env-config';

export async function POST(req: Request) {
  try {
    // 1. AUTENTICAÇÃO VIA URL PARAMETER
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (token !== KIWIFY_TOKEN) {
      console.error("[Kiwify] Unauthorized: Invalid token", token);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. PARSE DO BODY
    const body = await req.json();

    // 3. EXTRAÇÃO SEGURA DOS DADOS (Padrão Kiwify Docs)
    const email = body?.Customer?.email || body?.customer?.email || "unknown@email.com";
    const productName = body?.Product?.product_name || body?.Subscription?.plan?.name || "Desconhecido";
    
    // Status pode ser paid, waiting_payment, refused, refunded
    const orderStatus = body?.order_status || "unknown"; 
    
    // Evento ex: order_approved, pix_generated, subscription_renewed
    const eventType = body?.webhook_event_type || orderStatus; 

    console.log(`[Kiwify] Webhook received: ${eventType} | Status: ${orderStatus} | Email: ${email}`);

    // 4. LÓGICA DE NEGÓCIO E LIMITES (BeeGym)
    let planType = "free";
    let limitStudents = 0;
    let subscriptionStatus = "canceled";

    // Se o pagamento for aprovado (paid), libera o acesso com base no nome do produto
    if (orderStatus === "paid" || eventType === "order_approved" || eventType === "subscription_renewed") {
        subscriptionStatus = "active";
        
        const nameLower = productName.toLowerCase();
        if (nameLower.includes("starter")) { planType = "starter"; limitStudents = 20; }
        else if (nameLower.includes("plus")) { planType = "plus"; limitStudents = 40; }
        else if (nameLower.includes("studio")) { planType = "studio"; limitStudents = 100; }
        else if (nameLower.includes("pro")) { planType = "pro"; limitStudents = 500; }
    } else if (orderStatus === "waiting_payment") {
        subscriptionStatus = "pending";
    }

    // 5. ATUALIZAÇÃO NO SUPABASE
    // Primeiro localizamos a organização através do e-mail do perfil
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('organization_id')
        .ilike('email', email.trim())
        .maybeSingle();

    if (profileError) {
        console.error("[Kiwify] Profile search error:", profileError);
    }

    if (profile?.organization_id) {
        const orgId = profile.organization_id;
        
        // Atualiza a organização
        const { error: orgError } = await supabaseAdmin
            .from('organizations')
            .update({ 
                plan_type: planType, 
                limit_students: limitStudents, 
                subscription_status: subscriptionStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', orgId);

        if (orgError) {
            console.error("[Kiwify] Organization update error:", orgError);
        } else {
            console.log(`[Kiwify] Organization ${orgId} updated to ${planType} (${subscriptionStatus})`);
        }
    } else {
        console.warn(`[Kiwify] No organization found for email: ${email}`);
    }

    // 6. LOG NA TABELA webhook_logs
    await supabaseAdmin.from('webhook_logs').insert({
        email: email,
        event_type: eventType,
        payload: body,
        created_at: new Date().toISOString()
    });

    // 7. SUCESSO (OBRIGATÓRIO PARA A KIWIFY)
    return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

  } catch (error) {
    console.error("[Kiwify] Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
