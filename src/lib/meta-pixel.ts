/**
 * Utilitário para rastreamento de eventos padrão do Meta Pixel.
 * Esta biblioteca contém funções tipadas para os eventos com a moeda já configurada para BRL.
 */

// Declaração para evitar erros de tipagem com o objeto global window.fbq
declare global {
  interface Window {
    fbq: any;
  }
}

/**
 * Função base para disparar eventos do Meta Pixel com segurança
 * verificando se o script do pixel foi carregado.
 */
export const trackMetaEvent = (eventName: string, data?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (data) {
      window.fbq('track', eventName, data);
    } else {
      window.fbq('track', eventName);
    }
  }
};

// --- Eventos Padrão da Meta ---

export const trackAddPaymentInfo = () => trackMetaEvent('AddPaymentInfo');

export const trackAddToCart = () => trackMetaEvent('AddToCart');

export const trackAddToWishlist = () => trackMetaEvent('AddToWishlist');

export const trackCompleteRegistration = () => trackMetaEvent('CompleteRegistration');

export const trackContact = () => trackMetaEvent('Contact');

export const trackCustomizeProduct = () => trackMetaEvent('CustomizeProduct');

export const trackDonate = () => trackMetaEvent('Donate');

export const trackFindLocation = () => trackMetaEvent('FindLocation');

export const trackInitiateCheckout = () => trackMetaEvent('InitiateCheckout');

export const trackLead = () => trackMetaEvent('Lead');

export const trackPurchase = (value: number | string = 0.0) => {
  trackMetaEvent('Purchase', { value, currency: 'BRL' });
};

export const trackSchedule = () => trackMetaEvent('Schedule');

export const trackSearch = () => trackMetaEvent('Search');

export const trackStartTrial = (value: number | string = '0.00', predicted_ltv: number | string = '0.00') => {
  trackMetaEvent('StartTrial', { value, currency: 'BRL', predicted_ltv });
};

export const trackSubmitApplication = () => trackMetaEvent('SubmitApplication');

export const trackSubscribe = (value: number | string = '0.00', predicted_ltv: number | string = '0.00') => {
  trackMetaEvent('Subscribe', { value, currency: 'BRL', predicted_ltv });
};

export const trackViewContent = () => trackMetaEvent('ViewContent');
