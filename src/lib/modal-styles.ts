// Shared style tokens for modal forms. Mobile-first.

// 48px tap target on mobile (matches Material Design + iOS HIG), 40px on desktop.
export const fieldInput =
    'h-12 sm:h-10 rounded-xl border-slate-200 bg-white text-base sm:text-sm placeholder:text-slate-400 ' +
    'focus:border-bee-amber focus:ring-2 focus:ring-bee-amber/20 focus:ring-offset-0';

export const fieldLabel =
    'text-[13px] sm:text-[13px] font-semibold text-slate-700 mb-1.5 block';

export const sectionTitle =
    'text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 block';

// CTA buttons — full width on mobile, auto on desktop. 48px tall on mobile.
export const ctaPrimary =
    'w-full sm:w-auto h-12 sm:h-10 rounded-full px-6 ' +
    'bg-bee-amber hover:bg-amber-500 text-bee-midnight font-bold text-sm ' +
    'shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 ' +
    'flex items-center justify-center gap-2';

export const ctaSecondary =
    'w-full sm:w-auto h-12 sm:h-10 rounded-full px-5 ' +
    'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-medium ' +
    'transition-colors';

// Responsive grids: stack on mobile, columns on tablet+.
export const gridTwoCol = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
export const gridThreeCol = 'grid grid-cols-1 sm:grid-cols-3 gap-4';
