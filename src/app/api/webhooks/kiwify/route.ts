import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { KIWIFY_TOKEN } from '@/lib/env-config';

// Maps product name keywords to internal tier names (uppercase = saas_plans.tier)
const PRODUCT_TIER_MAP: Array<{ keyword: string; tier: string }> = [
  { keyword: 'enterprise', tier: 'ENTERPRISE' },
  { keyword: 'studio',    tier: 'STUDIO' },
  { keyword: 'starter',   tier: 'STARTER' },
  { keyword: 'plus',      tier: 'PLUS' },
  { keyword: 'pro',       tier: 'PRO' },
];

function extractTierFromProductName(productName: string): string | null {
  const lower = (productName || '').toLowerCase();
  for (const { keyword, tier } of PRODUCT_TIER_MAP) {
    if (lower.includes(keyword)) return tier;
  }
  return null;
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Maps Kiwify event types to the domain values accepted by the
// saas_subscription_events.event_type CHECK constraint.
function mapToDomainEventType(eventType: string, isFirstPurchase: boolean): string {
  switch (eventType) {
    case 'order_approved':         return isFirstPurchase ? 'SIGNUP' : 'RENEWAL';
    case 'subscription_renewed':   return 'RENEWAL';
    case 'subscription_canceled':  return 'CANCELLATION';
    case 'subscription_late':      return 'CHARGE_FAILED';
    case 'order_refunded':         return 'CANCELLATION';
    case 'chargeback':             return 'CANCELLATION';
    default:                       return 'RENEWAL';
  }
}

// Maps "evento" (Portuguese, simplified payload) to Kiwify event/status pair
const SIMPLE_EVENT_MAP: Record<string, { eventType: string; orderStatus: string }> = {
  'assinatura aprovada':  { eventType: 'subscription_renewed',  orderStatus: 'paid' },
  'assinatura renovada':  { eventType: 'subscription_renewed',  orderStatus: 'paid' },
  'compra aprovada':      { eventType: 'order_approved',        orderStatus: 'paid' },
  'pix gerado':           { eventType: 'pix_created',           orderStatus: 'waiting_payment' },
  'boleto gerado':        { eventType: 'boleto_created',        orderStatus: 'waiting_payment' },
  'assinatura cancelada': { eventType: 'subscription_canceled', orderStatus: 'canceled' },
  'assinatura atrasada':  { eventType: 'subscription_late',     orderStatus: 'past_due' },
  'compra recusada':      { eventType: 'order_rejected',        orderStatus: 'refused' },
  'reembolso':            { eventType: 'order_refunded',        orderStatus: 'refunded' },
  'chargeback':           { eventType: 'chargeback',            orderStatus: 'chargeback' },
};

export async function POST(req: Request) {
  // 1. Configuration check — fail closed if env var missing
  if (!KIWIFY_TOKEN) {
    console.error('[Kiwify] KIWIFY_TOKEN env var not configured. Rejecting all webhooks.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  // 2. Parse body once (used for both auth fallback and processing)
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // 3. Extract token from body OR query-string (Kiwify uses query, simple format uses body)
  const queryToken = new URL(req.url).searchParams.get('token')
                 ?? new URL(req.url).searchParams.get('signature');
  const bodyToken: string | null = body?.token ?? null;
  const providedToken = bodyToken || queryToken;

  if (!providedToken || !constantTimeEqual(providedToken, KIWIFY_TOKEN)) {
    // Log the rejection (but never log the actual token value)
    await supabaseAdmin.from('webhook_logs').insert({
      email: 'unknown',
      event_type: 'auth_failed',
      payload: {
        source: bodyToken ? 'body' : (queryToken ? 'query' : 'none'),
      },
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 4. Detect format: simple payload {email, evento, produto, token} vs Kiwify raw
  const isSimpleFormat = typeof body?.evento === 'string';

  let email: string;
  let productName: string;
  let eventType: string;
  let orderStatus: string;
  let kiwifyOrderId: string | null;
  let kiwifySubscriptionId: string | null;

  if (isSimpleFormat) {
    email = (body.email || 'unknown@email.com').toString().trim();
    productName = (body.produto || body.product || '').toString();
    const eventoKey = (body.evento as string).toLowerCase().trim();
    const mapped = SIMPLE_EVENT_MAP[eventoKey];
    if (mapped) {
      eventType = mapped.eventType;
      orderStatus = mapped.orderStatus;
    } else {
      // Unknown evento → still log it, treat as pass-through
      eventType = eventoKey;
      orderStatus = 'unknown';
    }
    kiwifyOrderId = body.order_id ?? null;
    kiwifySubscriptionId = body.subscription_id ?? null;
  } else {
    // Raw Kiwify payload
    email = (body?.Customer?.email || body?.customer?.email || 'unknown@email.com').toString().trim();
    productName = (body?.Product?.product_name || body?.Subscription?.plan?.name || '').toString();
    orderStatus = body?.order_status || 'unknown';
    eventType = body?.webhook_event_type || orderStatus;
    kiwifyOrderId = body?.order_id || null;
    kiwifySubscriptionId = body?.Subscription?.id || null;
  }

  console.log(`[Kiwify] format=${isSimpleFormat ? 'simple' : 'kiwify'} | ${eventType} | status=${orderStatus} | email=${email} | product="${productName}"`);

  try {
    // 5. Classify event
    const isPaymentApproved =
      orderStatus === 'paid' ||
      eventType === 'order_approved' ||
      eventType === 'subscription_renewed';

    const isWaitingPayment = orderStatus === 'waiting_payment';

    const isCanceled =
      eventType === 'subscription_canceled' ||
      eventType === 'order_refunded' ||
      eventType === 'chargeback' ||
      orderStatus === 'refunded' ||
      orderStatus === 'chargeback' ||
      orderStatus === 'canceled' ||
      orderStatus === 'refused';

    const isLate = eventType === 'subscription_late' || orderStatus === 'past_due';

    // 6. Derive subscription status (UPPERCASE — matches CHECK constraint added in migration 004)
    let subscriptionStatus = 'CANCELED';
    if (isPaymentApproved)      subscriptionStatus = 'ACTIVE';
    else if (isWaitingPayment)  subscriptionStatus = 'PENDING';
    else if (isLate)            subscriptionStatus = 'PAST_DUE';
    else if (isCanceled)        subscriptionStatus = 'CANCELED';

    // 7. Resolve plan tier
    const tier = extractTierFromProductName(productName);
    let saasPlanId: string | null = null;
    let dbMaxStudents: number = 0;

    if (tier && isPaymentApproved) {
      const { data: planRow } = await supabaseAdmin
        .from('saas_plans')
        .select('id, max_students')
        .eq('tier', tier)
        .maybeSingle();

      if (planRow) {
        saasPlanId = planRow.id;
        dbMaxStudents = planRow.max_students ?? 0;
      } else {
        const FALLBACK_LIMITS: Record<string, number> = {
          STARTER: 20, PLUS: 40, STUDIO: 100, PRO: 500, ENTERPRISE: 9999,
        };
        dbMaxStudents = FALLBACK_LIMITS[tier] ?? 0;
      }
    }

    const planType = tier ? tier.toLowerCase() : 'free';

    // 8. Find organization via profile email (case-insensitive)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .ilike('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('[Kiwify] Profile search error:', profileError);
    }

    const orgId = profile?.organization_id ?? null;

    if (orgId) {
      // 8a. Update organizations
      const orgUpdate: Record<string, unknown> = {
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      };

      if (isPaymentApproved) {
        orgUpdate.plan_type = planType;
        orgUpdate.limit_students = dbMaxStudents;
        orgUpdate.onboarding_completed = true;
      }

      if (isCanceled || isLate) {
        // Drop to free plan; middleware will block access via subscription_status
        orgUpdate.plan_type = 'free';
        orgUpdate.limit_students = 0;
      }

      const { error: orgError } = await supabaseAdmin
        .from('organizations')
        .update(orgUpdate)
        .eq('id', orgId);

      if (orgError) {
        console.error('[Kiwify] Organization update error:', orgError);
      } else {
        console.log(`[Kiwify] Org ${orgId} → plan=${planType} status=${subscriptionStatus}`);
      }

      // 8b. Update saas_subscriptions
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
        subUpdate.plan_tier = tierMap[planType] ?? tier;
        subUpdate.metodo = 'KIWIFY';
        if (saasPlanId) subUpdate.saas_plan_id = saasPlanId;
        subUpdate.pending_plan_tier = null;
        subUpdate.pending_plan_id = null;
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

      // 8c. Audit trail (event_type mapped to CHECK constraint domain)
      if (isPaymentApproved && tier) {
        // Detect first purchase by checking if there is no prior charge for this org
        const { count: prior } = await supabaseAdmin
          .from('saas_subscription_events')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId);
        const isFirstPurchase = (prior ?? 0) === 0;

        const { error: evtErr } = await supabaseAdmin.from('saas_subscription_events').insert({
          organization_id: orgId,
          event_type: mapToDomainEventType(eventType, isFirstPurchase),
          new_plan_tier: tierMap[planType] ?? 'UNKNOWN',
          kiwify_order_id: kiwifyOrderId,
          kiwify_subscription_id: kiwifySubscriptionId,
          effective_at: new Date().toISOString(),
          metadata: {
            kiwify_event: eventType,
            product_name: productName,
            order_status: orderStatus,
            source: isSimpleFormat ? 'simple' : 'kiwify',
          },
          created_at: new Date().toISOString(),
        });
        if (evtErr) console.error('[Kiwify] saas_subscription_events insert error:', evtErr);
      }

      if (isCanceled) {
        const { error: evtErr } = await supabaseAdmin.from('saas_subscription_events').insert({
          organization_id: orgId,
          event_type: 'CANCELLATION',
          new_plan_tier: 'FREE',
          kiwify_order_id: kiwifyOrderId,
          kiwify_subscription_id: kiwifySubscriptionId,
          effective_at: new Date().toISOString(),
          metadata: {
            kiwify_event: eventType,
            product_name: productName,
            order_status: orderStatus,
            source: isSimpleFormat ? 'simple' : 'kiwify',
          },
          created_at: new Date().toISOString(),
        });
        if (evtErr) console.error('[Kiwify] saas_subscription_events insert error:', evtErr);
      }
    } else {
      console.warn(`[Kiwify] No organization found for email: ${email}`);
    }

    // 9. Always log (auth passed)
    await supabaseAdmin.from('webhook_logs').insert({
      email,
      event_type: eventType,
      payload: body,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      message: orgId
        ? `Webhook processed for ${email} → ${subscriptionStatus}`
        : `Webhook received but no organization found for ${email}`,
      email,
      event: eventType,
      subscription_status: subscriptionStatus,
      plan_type: planType,
      org_found: !!orgId,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Kiwify] Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', detail: error?.message }, { status: 500 });
  }
}
