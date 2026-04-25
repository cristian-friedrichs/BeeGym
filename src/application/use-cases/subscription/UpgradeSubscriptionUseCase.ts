import { supabaseAdmin } from '@/lib/supabase/admin';
import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';
import { SupabaseSaasPlanRepository } from '@/application/repositories/SupabaseSaasPlanRepository';

// Kiwify checkout URLs per tier — keep in sync with src/config/plans.ts kiwify_link values
const KIWIFY_CHECKOUT: Record<string, string> = {
  STARTER:    'https://pay.kiwify.com.br/nDh67eT',
  PLUS:       'https://pay.kiwify.com.br/l0J7aBG',
  STUDIO:     'https://pay.kiwify.com.br/6N4RjAj',
  PRO:        'https://pay.kiwify.com.br/7snTI43',
};

export interface UpgradeSubscriptionInput {
  organizationId: string;
  newPlanTier: string;   // 'STARTER' | 'PLUS' | 'STUDIO' | 'PRO' | 'ENTERPRISE'
  userEmail?: string;    // Optional: pre-fill Kiwify checkout
  userName?: string;     // Optional: pre-fill Kiwify checkout
}

export interface UpgradeResult {
  action: 'redirect' | 'contact';
  url?: string;
  message: string;
  newPlanTier: string;
}

export class UpgradeSubscriptionUseCase {
  async execute(input: UpgradeSubscriptionInput): Promise<UpgradeResult> {
    const tier = input.newPlanTier.toUpperCase();

    // 1. Validate the target plan exists in DB
    const novoPlano = await SupabaseSaasPlanRepository.findByTier(tier);
    if (!novoPlano) {
      throw new Error(`Plano ${tier} não encontrado no sistema.`);
    }

    // 2. Fetch current active subscription (may be null for new orgs)
    const assinatura = await SupabaseAssinaturaRepository.findActiveByOrganization(
      input.organizationId
    );

    // 3. Store pending plan change in DB so the webhook can confirm it
    //    This also gives us visibility into what the user was trying to do
    await supabaseAdmin
      .from('saas_subscriptions')
      .update({
        pending_plan_id: novoPlano.id,
        pending_plan_tier: tier,
        pending_effective_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', input.organizationId);

    // 4. ENTERPRISE: no self-service checkout, contact sales
    if (tier === 'ENTERPRISE') {
      return {
        action: 'contact',
        message:
          'Para o plano Enterprise, entre em contato com nossa equipe. Retornaremos em até 24h.',
        newPlanTier: tier,
      };
    }

    // 5. Build Kiwify checkout URL with pre-filled customer data
    const baseUrl = KIWIFY_CHECKOUT[tier];
    if (!baseUrl) {
      throw new Error(`URL de checkout não configurada para o plano ${tier}.`);
    }

    const checkoutUrl = new URL(baseUrl);
    if (input.userEmail) checkoutUrl.searchParams.append('email', input.userEmail);
    if (input.userName)  checkoutUrl.searchParams.append('name', input.userName);

    return {
      action: 'redirect',
      url: checkoutUrl.toString(),
      message: `Redirecionando para o checkout do plano ${tier}. Após o pagamento, seu plano será atualizado automaticamente.`,
      newPlanTier: tier,
    };
  }
}
