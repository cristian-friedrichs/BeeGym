import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { KIWIFY_TOKEN } from '@/lib/env-config';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  // Log auth failures before returning so they appear in the audit log
  if (token !== KIWIFY_TOKEN) {
    console.error("[Kiwify] Unauthorized: received token =", token);
    await supabaseAdmin.from('webhook_logs').insert({
      email: 'unknown',
      event_type: 'auth_failed',
      payload: { received_token: token, expected_token_hint: KIWIFY_TOKEN?.slice(0, 4) + '****' },
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Kiwify sends Customer (capital C) for order webhooks
    const email = body?.Customer?.email || body?.customer?.email || "unknown@email.com";
    const productName =
      body?.Product?.product_name ||
      body?.Subscription?.plan?.name ||
      "Desconhecido";
    const orderStatus = body?.order_status || "unknown";
    const eventType = body?.webhook_event_type || orderStatus;
    const kiwifyOrderId = body?.order_id || null;
    const kiwifySubscriptionId = body?.Subscription?.id || null;

    console.log(`[Kiwify] ${eventType} | status: ${orderStatus} | email: ${email} | product: ${productName}`);

    // Determine new subscription state
    let planType = "free";
    let limitStudents = 0;
    let subscriptionStatus = "canceled";

    const isPaymentApproved =
      orderStatus === "paid" ||
      eventType === "order_approved" ||
      eventType === "subscription_renewed";

    const isLate = eventType === "subscription_late";

    if (isPaymentApproved) {
      subscriptionStatus = "active";
      const nameLower = productName.toLowerCase();
      if (nameLower.includes("starter")) { planType = "starter"; limitStudents = 20; }
      else if (nameLower.includes("plus")) { planType = "plus"; limitStudents = 40; }
      else if (nameLower.includes("studio")) { planType = "studio"; limitStudents = 100; }
      else if (nameLower.includes("pro")) { planType = "pro"; limitStudents = 500; }
    } else if (orderStatus === "waiting_payment") {
      subscriptionStatus = "pending";
    } else if (isLate) {
      subscriptionStatus = "past_due";
    }

    // Find organization via profile email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .ilike('email', email.trim())
      .maybeSingle();

    if (profileError) {
      console.error("[Kiwify] Profile search error:", profileError);
    }

    const orgId = profile?.organization_id;

    if (orgId) {
      // 1. Update organizations table
      const orgUpdate: Record<string, unknown> = {
        plan_type: planType,
        limit_students: limitStudents,
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      };

      // Mark onboarding complete on first successful payment so middleware lets the user in
      if (isPaymentApproved) {
        orgUpdate.onboarding_completed = true;
      }

      const { error: orgError } = await supabaseAdmin
        .from('organizations')
        .update(orgUpdate)
        .eq('id', orgId);

      if (orgError) {
        console.error("[Kiwify] Organization update error:", orgError);
      } else {
        console.log(`[Kiwify] Organization ${orgId} → ${planType} (${subscriptionStatus})`);
      }

      // 2. Update saas_subscriptions so verifyPaymentStatusAction works correctly
      const tierMap: Record<string, string> = {
        starter: 'STARTER', plus: 'PLUS', studio: 'STUDIO', pro: 'PRO',
      };
      const subUpdate: Record<string, unknown> = {
        status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      };
      if (kiwifyOrderId) subUpdate.kiwify_order_id = kiwifyOrderId;
      if (kiwifySubscriptionId) subUpdate.kiwify_subscription_id = kiwifySubscriptionId;
      if (isPaymentApproved && planType !== "free") {
        subUpdate.plan_tier = tierMap[planType] || null;
        subUpdate.metodo = 'KIWIFY';
      }

      const { error: subError } = await supabaseAdmin
        .from('saas_subscriptions')
        .update(subUpdate)
        .eq('organization_id', orgId);

      if (subError) {
        console.error("[Kiwify] saas_subscriptions update error:", subError);
      }

      // 3. Record event for audit trail
      if (isPaymentApproved) {
        await supabaseAdmin.from('saas_subscription_events').insert({
          organization_id: orgId,
          event_type: eventType,
          new_plan_tier: tierMap[planType] || 'UNKNOWN',
          kiwify_order_id: kiwifyOrderId,
          kiwify_subscription_id: kiwifySubscriptionId,
          effective_at: new Date().toISOString(),
          metadata: { product_name: productName, order_status: orderStatus },
          created_at: new Date().toISOString(),
        });
      }
    } else {
      console.warn(`[Kiwify] No organization found for email: ${email}`);
    }

    // Always log the webhook event
    await supabaseAdmin.from('webhook_logs').insert({
      email,
      event_type: eventType,
      payload: body,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

  } catch (error) {
    console.error("[Kiwify] Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
