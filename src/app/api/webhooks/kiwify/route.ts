import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { KIWIFY_TOKEN } from '@/lib/env-config';

// Maps Kiwify product name keywords to our internal tier names (uppercase = saas_plans.tier)
const PRODUCT_TIER_MAP: Array<{ keyword: string; tier: string }> = [
  { keyword: 'enterprise', tier: 'ENTERPRISE' },
  { keyword: 'studio',    tier: 'STUDIO' },
  { keyword: 'starter',   tier: 'STARTER' },
  { keyword: 'plus',      tier: 'PLUS' },
  { keyword: 'pro',       tier: 'PRO' },
];

function extractTierFromProductName(productName: string): string | null {
  const lower = productName.toLowerCase();
  for (const { keyword, tier } of PRODUCT_TIER_MAP) {
    if (lower.includes(keyword)) return tier;
  }
  return null;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  // Log auth failures so they appear in the audit log with event_type='auth_failed'
  if (token !== KIWIFY_TOKEN) {
    console.error('[Kiwify] Unauthorized: received token =', token);
    await supabaseAdmin.from('webhook_logs').insert({
      email: 'unknown',
      event_type: 'auth_failed',
      payload: { received_token: token, hint: 'token should match KIWIFY_TOKEN env var' },
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();

    // --- Extract common fields from Kiwify payload ---
    const email: string =
      body?.Customer?.email ||
      body?.customer?.email ||
      'unknown@email.com';

    const productName: string =
      body?.Product?.product_name ||
      body?.Subscription?.plan?.name ||
      '';

    const orderStatus: string = body?.order_status || 'unknown';
    const eventType: string   = body?.webhook_event_type || orderStatus;
    const kiwifyOrderId: string | null       = body?.order_id || null;
    const kiwifySubscriptionId: string | null = body?.Subscription?.id || null;

    console.log(`[Kiwify] ${eventType} | status: ${orderStatus} | email: ${email} | product: "${productName}"`);

    // --- Classify the event ---
    const isPaymentApproved =
      orderStatus === 'paid' ||
      eventType === 'order_approved' ||
      eventType === 'subscription_renewed';

    const isWaitingPayment = orderStatus === 'waiting_payment';

    const isCanceled =
      eventType === 'subscription_canceled' ||
      orderStatus === 'refunded' ||
      orderStatus === 'chargeback';

    const isLate = eventType === 'subscription_late';

    // --- Derive subscription status ---
    let subscriptionStatus = 'canceled';
    if (isPaymentApproved)  subscriptionStatus = 'active';
    else if (isWaitingPayment) subscriptionStatus = 'pending';
    else if (isLate)        subscriptionStatus = 'past_due';

    // --- Resolve plan tier and DB record ---
    // First try to extract tier from the product name
    const tier = extractTierFromProductName(productName);

    // Look up the saas_plans record so we use DB values (max_students, allowed_features, id)
    // instead of hardcoded numbers that can drift out of sync.
    let saasPlanId: string | null = null;
    let dbMaxStudents: number | null = 0;

    if (tier && isPaymentApproved) {
      const { data: planRow } = await supabaseAdmin
        .from('saas_plans')
        .select('id, max_students')
        .eq('tier', tier)
        .maybeSingle();

      if (planRow) {
        saasPlanId   = planRow.id;
        dbMaxStudents = planRow.max_students ?? 0;
      } else {
        // saas_plans record missing — fall back to safe hardcoded limits
        const FALLBACK_LIMITS: Record<string, number> = {
          STARTER: 20, PLUS: 40, STUDIO: 100, PRO: 500, ENTERPRISE: 9999,
        };
        dbMaxStudents = FALLBACK_LIMITS[tier] ?? 0;
      }
    }

    // plan_type stored in organizations uses lowercase tier
    const planType = tier ? tier.toLowerCase() : 'free';

    // --- Find the organization via profile email ---
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .ilike('email', email.trim())
      .maybeSingle();

    if (profileError) {
      console.error('[Kiwify] Profile search error:', profileError);
    }

    const orgId = profile?.organization_id ?? null;

    if (orgId) {
      // 1. Update organizations table
      const orgUpdate: Record<string, unknown> = {
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      };

      if (isPaymentApproved) {
        orgUpdate.plan_type        = planType;
        orgUpdate.limit_students   = dbMaxStudents;
        orgUpdate.onboarding_completed = true; // Allow middleware to grant access
      }

      if (isCanceled) {
        // Keep onboarding_completed=true so the user can access pending-activation page
        // and understand their account status; middleware blocks via subscription_status
        orgUpdate.plan_type      = 'free';
        orgUpdate.limit_students = 0;
      }

      const { error: orgError } = await supabaseAdmin
        .from('organizations')
        .update(orgUpdate)
        .eq('id', orgId);

      if (orgError) {
        console.error('[Kiwify] Organization update error:', orgError);
      } else {
        console.log(`[Kiwify] Organization ${orgId} → ${planType} (${subscriptionStatus})`);
      }

      // 2. Update saas_subscriptions — this is what useSubscription hook reads
      const tierMap: Record<string, string> = {
        starter: 'STARTER', plus: 'PLUS', studio: 'STUDIO', pro: 'PRO', enterprise: 'ENTERPRISE',
      };
      const subUpdate: Record<string, unknown> = {
        status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      };

      if (kiwifyOrderId)        subUpdate.kiwify_order_id        = kiwifyOrderId;
      if (kiwifySubscriptionId) subUpdate.kiwify_subscription_id = kiwifySubscriptionId;

      if (isPaymentApproved && tier) {
        subUpdate.plan_tier  = tierMap[planType] ?? tier;
        subUpdate.metodo     = 'KIWIFY';
        // Critical: set the FK so useSubscription can join saas_plans for allowed_features/max_students
        if (saasPlanId) subUpdate.saas_plan_id = saasPlanId;
        // Clear any pending upgrade that just completed
        subUpdate.pending_plan_tier = null;
        subUpdate.pending_plan_id   = null;
        subUpdate.pending_effective_at = null;
      }

      if (isCanceled) {
        subUpdate.plan_tier = null;
      }

      const { error: subError } = await supabaseAdmin
        .from('saas_subscriptions')
        .update(subUpdate)
        .eq('organization_id', orgId);

      if (subError) {
        console.error('[Kiwify] saas_subscriptions update error:', subError);
      }

      // 3. Record event in audit trail
      if (isPaymentApproved && tier) {
        await supabaseAdmin.from('saas_subscription_events').insert({
          organization_id: orgId,
          event_type: eventType,
          new_plan_tier: tierMap[planType] ?? 'UNKNOWN',
          kiwify_order_id: kiwifyOrderId,
          kiwify_subscription_id: kiwifySubscriptionId,
          effective_at: new Date().toISOString(),
          metadata: { product_name: productName, order_status: orderStatus },
          created_at: new Date().toISOString(),
        });
      }

      if (isCanceled) {
        await supabaseAdmin.from('saas_subscription_events').insert({
          organization_id: orgId,
          event_type: 'subscription_canceled',
          new_plan_tier: 'FREE',
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

    // Always log the webhook (after auth passed)
    await supabaseAdmin.from('webhook_logs').insert({
      email,
      event_type: eventType,
      payload: body,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('[Kiwify] Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
