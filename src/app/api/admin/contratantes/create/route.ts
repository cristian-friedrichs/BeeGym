import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireAdmin, logSecurityEvent } from '@/lib/auth-utils';
import { withRateLimit } from '@/lib/rate-limit/limiter';

export async function POST(req: NextRequest) {
    const rateLimitResponse = await withRateLimit(req, 5);
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAdmin(req);
    if ('error' in auth) return auth.error;

    logSecurityEvent('ADMIN_CREATE_CONTRATANTE', {
        userId: auth.user.id,
        path: req.nextUrl.pathname,
        action: 'create_contratante'
    });

    try {
        const body = await req.json();
        const {
            fullName, password, phone,
            businessType, empresaName, document, studentRange,
            hasPhysicalLocation,
            addressZip, addressLine1, addressNumber, addressComplement,
            addressNeighborhood, addressCity, addressState,
            planoId, isTeste, discountType, discountValue, discountDurationMonths
        } = body;
        const email = body.email?.trim()?.toLowerCase();

        if (!fullName || !email || !password || !empresaName || !planoId) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
        }

        // 1. Fetch Plan
        const { data: plano, error: planoError } = await supabaseAdmin
            .from('saas_plans').select('*').eq('id', planoId).single();

        if (planoError || !plano) {
            return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
        }

        // 2. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, phone }
        });

        if (authError || !authData.user) {
            return NextResponse.json({ error: authError?.message || 'Erro ao criar usuário auth.' }, { status: 500 });
        }

        const userId = authData.user.id;

        // 3. Create Organization
        const orgInsert = await supabaseAdmin
            .from('organizations')
            .insert({
                name: empresaName,
                email,
                contact_phone: phone,
                cpf_cnpj: document,
                business_type: businessType || 'Academia',
                student_range: studentRange,
                has_physical_location: hasPhysicalLocation ?? true,
                address_zip: addressZip,
                address_line1: addressLine1,
                address_number: addressNumber,
                address_complement: addressComplement,
                address_neighborhood: addressNeighborhood,
                address_city: addressCity,
                address_state: addressState,
                subscription_status: isTeste ? 'TRIAL' : 'ACTIVE',
                onboarding_completed: true,
            })
            .select().single();

        if (orgInsert.error || !orgInsert.data) {
            console.error('[Admin Create Org]', orgInsert.error);
            return NextResponse.json({ error: 'Erro ao criar organização.' }, { status: 500 });
        }

        const orgId = orgInsert.data.id;

        // 4. Update or Upsert Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                organization_id: orgId,
                full_name: fullName,
                email,
                phone,
                role: 'OWNER',
                status: 'ACTIVE'
            });

        if (profileError) {
            console.error('[Admin Create Profile]', profileError);
        }

        // 5. Create Subscription
        let finalPrice = Number(plano.price);

        if (!isTeste && discountType && discountValue) {
            if (discountType === 'PERCENTAGE') {
                finalPrice = Math.max(0, finalPrice * (1 - Number(discountValue) / 100));
            } else if (discountType === 'FIXED_AMOUNT') {
                finalPrice = Math.max(0, finalPrice - Number(discountValue));
            } else if (discountType === 'FREE_MONTHS') {
                finalPrice = 0;
            }
        }

        const { error: subError } = await supabaseAdmin
            .from('saas_subscriptions')
            .insert({
                organization_id: orgId,
                saas_plan_id: plano.id,
                plan_tier: plano.tier,
                metodo: isTeste ? 'TESTE_MANUAL' : 'MANUAL_ADMIN',
                status: isTeste ? 'TESTE' : 'ATIVO',
                valor_mensal: isTeste ? 0 : finalPrice,
                dia_vencimento: new Date().getDate(),
                manual_discount_amount: discountType === 'FIXED_AMOUNT' ? Number(discountValue) : null,
                manual_discount_percentage: discountType === 'PERCENTAGE' ? Number(discountValue) : null,
                promo_months_remaining: discountType === 'FREE_MONTHS' ? Number(discountDurationMonths) : null
            });

        if (subError) {
            console.error('[Admin Create Subscription]', subError);
        }

        return NextResponse.json({ success: true, organization_id: orgId, user_id: userId }, { status: 201 });

    } catch (err: any) {
        console.error('[Admin Configurar Cliente] Erro:', err);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
