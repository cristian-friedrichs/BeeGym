// Shared style tokens for modals. Mobile-first: full-height drawer-like on phones,
// centered card on tablets and up.

// DialogContent wrapper — applied via `className` prop.
// Mobile: full screen with rounded top corners. Desktop: centered card with max-width.
export const modalContent =
    'p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col ' +
    // Mobile: take nearly the entire viewport
    'w-screen max-w-none h-[100dvh] max-h-[100dvh] rounded-none ' +
    // Tablet+
    'sm:w-auto sm:max-w-[576px] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl';

// Header — sticky at the top of the modal.
export const modalHeader =
    'px-4 sm:px-6 pt-5 pb-4 border-b border-slate-100 bg-white shrink-0';

export const modalTitle =
    'text-base sm:text-[17px] font-semibold text-slate-900 leading-tight';

export const modalDescription =
    'text-xs sm:text-sm text-slate-500 mt-0.5';

// Scrollable body — flex-1 lets it absorb remaining height between header and footer.
export const modalBody =
    'flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4';

// Footer — sticky bottom with safe-area inset for iOS home indicator.
export const modalFooter =
    'px-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:pt-4 ' +
    'border-t border-slate-100 bg-white shrink-0 ' +
    'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3';

// Form fields — 44px minimum tap target on mobile, smaller on desktop.
export const fieldInput =
    'h-11 sm:h-9 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 ' +
    'focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';

export const fieldLabel =
    'text-sm font-medium text-slate-700';

// Common grid: 1 column on mobile, N columns on desktop.
export const gridTwoCol = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
export const gridThreeCol = 'grid grid-cols-1 sm:grid-cols-3 gap-3';

// CTA buttons. Mobile: full width. Desktop: auto.
export const ctaPrimary =
    'w-full sm:w-auto h-11 sm:h-9 rounded-full px-6 ' +
    'bg-bee-amber hover:bg-amber-500 text-bee-midnight font-semibold text-sm ' +
    'shadow-sm transition-all active:scale-[0.98] disabled:opacity-60';

export const ctaSecondary =
    'w-full sm:w-auto h-11 sm:h-9 rounded-full px-5 ' +
    'border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium';
