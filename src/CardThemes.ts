/**
 * FlashForge Card Themes
 * 4 distinct, professional visual themes (Modern, Minimalist, Academic, Clinical)
 * with specific Tailwind classes for typography, borders, and spacing.
 */

export type CardThemeName = 'Modern' | 'Minimalist' | 'Academic' | 'Clinical';

export interface CardThemeStyle {
  id: CardThemeName;
  name: string;
  description: string;
  
  // Specific Tailwind classes for typography
  typography: {
    fontFamily: string;
    question: string;
    answer: string;
    header: string;
    badge: string;
    context: string;
    reference: string;
    subText: string;
  };

  // Specific Tailwind classes for borders
  borders: {
    container: string;
    divider: string;
    frontAccent: string;
    backAccent: string;
    badge: string;
    refBadge: string;
  };

  // Specific Tailwind classes for spacing
  spacing: {
    padding: string;
    contentGap: string;
    headerMargin: string;
    footerPadding: string;
    accentPadding: string;
  };

  // Full composite container styling (colors, shadows, background)
  containerClasses: string;
  frontAccentClasses: string;
  backAccentClasses: string;
  refBadgeClasses: string;
  headerBadgeClasses: string;
  isLight?: boolean;
}

export const CARD_THEMES: Record<CardThemeName, CardThemeStyle> = {
  Modern: {
    id: 'Modern',
    name: 'Modern',
    description: 'Arktisk dypblå og skandinavisk eleganse med responsiv høy kontrast og presis sans-serif.',
    typography: {
      fontFamily: 'font-sans',
      question: 'text-white font-extrabold text-xl sm:text-2xl leading-snug tracking-tight',
      answer: 'text-slate-100 font-normal text-base sm:text-lg leading-relaxed whitespace-pre-line',
      header: 'text-sky-400 font-bold text-xs uppercase tracking-wider',
      badge: 'text-sky-300 font-mono font-bold text-xs',
      context: 'text-slate-300 font-medium text-xs sm:text-sm',
      reference: 'text-sky-200 font-semibold text-xs',
      subText: 'text-slate-400 italic text-xs',
    },
    borders: {
      container: 'border-2 border-slate-700/80 hover:border-sky-500/60 rounded-3xl',
      divider: 'border-b border-white/10',
      frontAccent: 'border-l-4 border-sky-400',
      backAccent: 'border-l-4 border-emerald-400',
      badge: 'border border-sky-500/30 rounded-lg',
      refBadge: 'border border-sky-600/40 rounded-xl',
    },
    spacing: {
      padding: 'p-6 sm:p-7',
      contentGap: 'space-y-4',
      headerMargin: 'pb-3.5 mb-2',
      footerPadding: 'pt-3.5 mt-4',
      accentPadding: 'pl-4',
    },
    containerClasses: 'bg-[#0c1424] text-slate-100 shadow-[0_14px_40px_rgba(0,0,0,0.55)]',
    frontAccentClasses: 'border-l-4 border-sky-400 pl-4 space-y-3.5',
    backAccentClasses: 'border-l-4 border-emerald-400 pl-4 space-y-3.5',
    refBadgeClasses: 'bg-[#0b172a] text-sky-200 border border-sky-600/40 px-3 py-1.5 rounded-xl',
    headerBadgeClasses: 'text-sky-300 font-bold bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md',
    isLight: false,
  },

  Minimalist: {
    id: 'Minimalist',
    name: 'Minimalist',
    description: 'Monokrom sveitsisk designstil med kompromissløs renhet, nøytrale toner og fokus på kunnskap.',
    typography: {
      fontFamily: 'font-sans',
      question: 'text-neutral-50 font-semibold text-lg sm:text-xl leading-normal tracking-normal',
      answer: 'text-neutral-200 font-normal text-sm sm:text-base leading-relaxed whitespace-pre-line',
      header: 'text-neutral-400 font-semibold text-[11px] uppercase tracking-widest',
      badge: 'text-neutral-300 font-mono text-[11px]',
      context: 'text-neutral-300 font-normal text-xs',
      reference: 'text-neutral-300 font-medium text-xs',
      subText: 'text-neutral-400 text-xs',
    },
    borders: {
      container: 'border border-neutral-800 hover:border-neutral-600 rounded-2xl',
      divider: 'border-b border-neutral-850',
      frontAccent: 'border-l-2 border-neutral-300',
      backAccent: 'border-l-2 border-emerald-500',
      badge: 'border border-neutral-800 rounded',
      refBadge: 'border border-neutral-800 rounded-lg',
    },
    spacing: {
      padding: 'p-6 sm:p-8',
      contentGap: 'space-y-4',
      headerMargin: 'pb-3 mb-2',
      footerPadding: 'pt-3 mt-4',
      accentPadding: 'pl-3.5',
    },
    containerClasses: 'bg-[#0a0a0c] text-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.6)]',
    frontAccentClasses: 'border-l-2 border-neutral-300 pl-3.5 space-y-3',
    backAccentClasses: 'border-l-2 border-emerald-500 pl-3.5 space-y-3',
    refBadgeClasses: 'bg-neutral-900 text-neutral-300 border border-neutral-800 px-3 py-1.5 rounded-lg',
    headerBadgeClasses: 'text-neutral-300 font-medium bg-neutral-900/80 border border-neutral-700/60 px-2 py-0.5 rounded',
    isLight: false,
  },

  Academic: {
    id: 'Academic',
    name: 'Academic',
    description: 'Tradisjonell universitet- og tidsskriftstil med verdig serif-typografi og dype gyldne aksenter.',
    typography: {
      fontFamily: 'font-serif',
      question: 'text-[#fbf9f4] font-serif font-bold text-xl sm:text-2xl leading-relaxed tracking-normal',
      answer: 'text-[#ece3d3] font-serif font-normal text-base sm:text-lg leading-relaxed whitespace-pre-line',
      header: 'text-[#d4af37] font-serif font-bold text-xs uppercase tracking-widest',
      badge: 'text-[#e0a96d] font-mono font-bold text-xs',
      context: 'text-[#d6c7b0] font-serif text-sm italic',
      reference: 'text-[#d4af37] font-serif font-medium text-xs',
      subText: 'text-[#b8a78e] font-serif italic text-xs',
    },
    borders: {
      container: 'border-2 border-[#524132] hover:border-[#d4af37]/60 rounded-3xl',
      divider: 'border-b border-[#3d2f23]',
      frontAccent: 'border-l-4 border-[#d4af37]',
      backAccent: 'border-l-4 border-[#86efac]',
      badge: 'border border-[#68523c] rounded-md',
      refBadge: 'border border-[#5a4430] rounded-xl',
    },
    spacing: {
      padding: 'p-7 sm:p-8',
      contentGap: 'space-y-4.5',
      headerMargin: 'pb-4 mb-2.5',
      footerPadding: 'pt-4 mt-4.5',
      accentPadding: 'pl-4.5',
    },
    containerClasses: 'bg-[#15110e] text-[#f3ece2] shadow-[0_14px_45px_rgba(0,0,0,0.7)]',
    frontAccentClasses: 'border-l-4 border-[#d4af37] pl-4.5 space-y-3.5',
    backAccentClasses: 'border-l-4 border-[#86efac] pl-4.5 space-y-3.5',
    refBadgeClasses: 'bg-[#221a14] text-[#e0a96d] border border-[#5a4430] px-3.5 py-1.5 rounded-xl',
    headerBadgeClasses: 'text-[#d4af37] font-serif font-bold bg-[#261c14] border border-[#68523c] px-2.5 py-0.5 rounded-md',
    isLight: false,
  },

  Clinical: {
    id: 'Clinical',
    name: 'Clinical',
    description: 'Presis medisinsk sykehuslayout med klinisk teal-glød, optimal for symptomer, anatomi og differensialer.',
    typography: {
      fontFamily: 'font-sans',
      question: 'text-white font-bold text-xl sm:text-2xl leading-snug tracking-tight',
      answer: 'text-teal-50 font-normal text-base sm:text-lg leading-relaxed whitespace-pre-line',
      header: 'text-teal-300 font-bold text-xs uppercase tracking-wider',
      badge: 'text-teal-300 font-mono font-bold text-xs',
      context: 'text-teal-200/90 font-medium text-xs sm:text-sm',
      reference: 'text-teal-200 font-semibold text-xs',
      subText: 'text-teal-300/70 italic text-xs',
    },
    borders: {
      container: 'border-2 border-teal-500/40 hover:border-teal-400 rounded-3xl',
      divider: 'border-b border-teal-500/20',
      frontAccent: 'border-l-4 border-teal-400',
      backAccent: 'border-l-4 border-emerald-400',
      badge: 'border border-teal-500/30 rounded-lg',
      refBadge: 'border border-teal-600/40 rounded-xl',
    },
    spacing: {
      padding: 'p-6 sm:p-7',
      contentGap: 'space-y-4',
      headerMargin: 'pb-3.5 mb-2',
      footerPadding: 'pt-3.5 mt-4',
      accentPadding: 'pl-4',
    },
    containerClasses: 'bg-[#041619] text-teal-50 shadow-[0_14px_40px_rgba(20,184,166,0.16)]',
    frontAccentClasses: 'border-l-4 border-teal-400 pl-4 space-y-3.5',
    backAccentClasses: 'border-l-4 border-emerald-400 pl-4 space-y-3.5',
    refBadgeClasses: 'bg-[#0a262e] text-teal-200 border border-teal-600/40 px-3 py-1.5 rounded-xl',
    headerBadgeClasses: 'text-teal-300 font-bold bg-teal-950/70 border border-teal-500/40 px-2 py-0.5 rounded-md',
    isLight: false,
  },
};

/**
 * Resolves any theme identifier (case-insensitive) to one of the 4 defined themes.
 * Defaults to 'Modern'.
 */
export function resolveCardTheme(theme?: string): CardThemeStyle {
  if (!theme) return CARD_THEMES.Modern;
  const t = theme.trim().toLowerCase();
  
  if (t === 'minimalist' || t === 'minimal' || t === 'swiss') {
    return CARD_THEMES.Minimalist;
  }
  if (t === 'academic' || t === 'editorial' || t === 'research') {
    return CARD_THEMES.Academic;
  }
  if (t === 'clinical' || t === 'case' || t === 'medication' || t === 'anatomy' || t === 'emergency') {
    return CARD_THEMES.Clinical;
  }
  return CARD_THEMES.Modern;
}
