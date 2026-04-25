import { SupabaseAssinaturaRepository } from '@/application/repositories/SupabaseAssinaturaRepository';

// Kiwify subscriber portal — where buyers manage their subscriptions
const KIWIFY_SUBSCRIBER_PORTAL = 'https://app.kiwify.com.br';

export interface CancelSubscriptionInput {
  organizationId: string;
}

export interface CancelResult {
  action: 'redirect';
  url: string;
  message: string;
}

export class CancelSubscriptionUseCase {
  async execute(input: CancelSubscriptionInput): Promise<CancelResult> {
    // 1. Validate there is an active subscription
    const assinatura = await SupabaseAssinaturaRepository.findActiveByOrganization(
      input.organizationId
    );

    if (!assinatura) {
      throw new Error('Nenhuma assinatura ativa encontrada para esta organização.');
    }

    // 2. Kiwify manages the subscription lifecycle — cancellation must happen
    //    on the Kiwify subscriber portal. BeeGym will be notified automatically
    //    via the 'subscription_canceled' webhook event and will update Supabase.
    //
    //    We do NOT mark the subscription as canceled here to avoid the user
    //    losing access before Kiwify actually processes the cancellation.
    return {
      action: 'redirect',
      url: KIWIFY_SUBSCRIBER_PORTAL,
      message:
        'Para cancelar sua assinatura, acesse o portal Kiwify (nova aba). ' +
        'Após o cancelamento, seu acesso será encerrado automaticamente no próximo ciclo.',
    };
  }
}
