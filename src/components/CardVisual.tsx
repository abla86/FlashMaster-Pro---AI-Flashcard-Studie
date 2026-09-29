import React, { useState } from 'react';
import { Flashcard, CardDesignFamily } from '../types/flashcard';
import { cleanReferenceArtifacts, formatToApa7Reference } from '../utils/referenceFormatter';
import { CardThemeName, resolveCardTheme } from './CardThemes';
import { getDeterministicSvgForTopic } from '../utils/svgLibrary';
import {
  Volume2,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Star,
  Activity,
  Heart,
  Pill,
  FileText,
  Clock,
  GitBranch,
  Split,
  Search,
  Scale,
  Zap,
  Maximize2,
  X,
} from 'lucide-react';

export interface FlashcardDesignStyle {
  container: string;
  headerBadge: string;
  frontAccent: string;
  backAccent: string;
  refBadge: string;
  titleColor: string;
  subColor: string;
  fontClass: string;
  isLight: boolean;
  icon: React.ReactNode;
}

// Helper to get styling for all FlashForge design families
export function getFlashcardDesignStyles(designName: string): FlashcardDesignStyle {
  const d = (designName || 'Nordic').toLowerCase();

  // 1. Emergency / Akutt / Trauma
  if (d.includes('emergency') || d.includes('akutt') || d.includes('trauma')) {
    return {
      container: 'bg-[#150a0c] border-rose-500/50 shadow-[0_12px_36px_rgba(244,63,94,0.18)] text-rose-50',
      headerBadge: 'text-rose-400 font-bold',
      frontAccent: 'border-l-4 border-rose-500',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#220c0e] text-rose-200 border border-rose-700/50',
      titleColor: 'text-white font-extrabold',
      subColor: 'text-rose-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Activity className="w-3.5 h-3.5 text-rose-400" />,
    };
  }

  // 2. Anatomy / Anatomi
  if (d.includes('anatomy') || d.includes('anatomi')) {
    return {
      container: 'bg-[#120d24] border-indigo-500/40 shadow-[0_12px_36px_rgba(99,102,241,0.18)] text-indigo-50',
      headerBadge: 'text-indigo-300 font-bold',
      frontAccent: 'border-l-4 border-indigo-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#1a1433] text-indigo-200 border border-indigo-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-indigo-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Heart className="w-3.5 h-3.5 text-indigo-400" />,
    };
  }

  // 3. Medication / Farmakologi
  if (d.includes('medication') || d.includes('legemiddel') || d.includes('farmasi') || d.includes('pharma')) {
    return {
      container: 'bg-[#071922] border-cyan-500/40 shadow-[0_12px_36px_rgba(6,182,212,0.16)] text-cyan-50',
      headerBadge: 'text-cyan-300 font-bold',
      frontAccent: 'border-l-4 border-cyan-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#0b2430] text-cyan-200 border border-cyan-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-cyan-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Pill className="w-3.5 h-3.5 text-cyan-400" />,
    };
  }

  // 4. Clinical / Case Study / Kasus
  if (d.includes('clinical') || d.includes('case') || d.includes('kasus')) {
    return {
      container: 'bg-[#06181d] border-teal-500/40 shadow-[0_12px_36px_rgba(20,184,166,0.16)] text-teal-50',
      headerBadge: 'text-teal-300 font-bold',
      frontAccent: 'border-l-4 border-teal-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#0a262e] text-teal-200 border border-teal-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-teal-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Activity className="w-3.5 h-3.5 text-teal-400" />,
    };
  }

  // 5. Light Premium / Studio Ivory / Papir (Lys daglesing)
  if (d.includes('light') || d.includes('ivory') || d.includes('papir') || d.includes('studio light')) {
    return {
      container: 'bg-[#faf8f5] border-[#e2ded5] shadow-[0_12px_32px_rgba(0,0,0,0.07)] text-[#1e293b]',
      headerBadge: 'text-sky-700 font-bold',
      frontAccent: 'border-l-4 border-sky-600',
      backAccent: 'border-l-4 border-emerald-600',
      refBadge: 'bg-[#f0ece4] text-[#44403c] border border-[#d6d0c4]',
      titleColor: 'text-[#0f172a] font-bold',
      subColor: 'text-[#475569]',
      fontClass: 'font-sans',
      isLight: true,
      icon: <BookOpen className="w-3.5 h-3.5 text-sky-700" />,
    };
  }

  // 6. Dark Premium / Obsidian Gold / Luksus
  if (d.includes('dark') || d.includes('obsidian') || (d.includes('premium') && !d.includes('light') && !d.includes('academic'))) {
    return {
      container: 'bg-[#090b10] border-amber-500/35 shadow-[0_14px_40px_rgba(217,178,110,0.14)] text-amber-50',
      headerBadge: 'text-amber-400 font-bold',
      frontAccent: 'border-l-4 border-amber-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#17140e] text-amber-200 border border-amber-600/40',
      titleColor: 'text-white font-extrabold tracking-tight',
      subColor: 'text-amber-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    };
  }

  // 7. Academic / Editorial / Jus / Forskningsmetode
  if (d.includes('academic') || d.includes('research') || d.includes('editorial') || d.includes('pico')) {
    return {
      container: 'bg-[#15110e] border-[#524132] shadow-[0_12px_36px_rgba(0,0,0,0.65)] text-[#f3ece2]',
      headerBadge: 'text-[#d4af37] font-serif font-bold',
      frontAccent: 'border-l-4 border-[#d4af37]',
      backAccent: 'border-l-4 border-[#86efac]',
      refBadge: 'bg-[#221a14] text-[#e0a96d] border border-[#4f3c2c]',
      titleColor: 'text-[#fdfcf7] font-serif font-bold',
      subColor: 'text-[#c2b69d]',
      fontClass: 'font-serif',
      isLight: false,
      icon: <Scale className="w-3.5 h-3.5 text-[#d4af37]" />,
    };
  }

  // 8. Exam / Eksamen
  if (d.includes('exam') || d.includes('eksamen')) {
    return {
      container: 'bg-[#181309] border-amber-600/45 shadow-[0_12px_36px_rgba(245,158,11,0.16)] text-amber-50',
      headerBadge: 'text-amber-400 font-bold',
      frontAccent: 'border-l-4 border-amber-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#241c0e] text-amber-200 border border-amber-600/40',
      titleColor: 'text-white font-extrabold',
      subColor: 'text-amber-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <FileText className="w-3.5 h-3.5 text-amber-400" />,
    };
  }

  // 9. Timeline / Chrono / Prosess / Algoritme
  if (d.includes('timeline') || d.includes('process') || d.includes('tidslinje') || d.includes('prosess')) {
    return {
      container: 'bg-[#081525] border-sky-600/40 shadow-[0_12px_32px_rgba(2,132,199,0.18)] text-sky-100',
      headerBadge: 'text-sky-300 font-bold',
      frontAccent: 'border-l-4 border-sky-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#0b2138] text-sky-200 border border-sky-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-sky-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Clock className="w-3.5 h-3.5 text-sky-400" />,
    };
  }

  // 10. Comparison / Decision Tree / Differensial
  if (d.includes('comparison') || d.includes('decision') || d.includes('sammenligning') || d.includes('beslutning')) {
    return {
      container: 'bg-[#0e1322] border-indigo-500/45 shadow-[0_12px_32px_rgba(99,102,241,0.16)] text-indigo-50',
      headerBadge: 'text-indigo-300 font-bold',
      frontAccent: 'border-l-4 border-indigo-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#151c2e] text-indigo-200 border border-indigo-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-indigo-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Split className="w-3.5 h-3.5 text-indigo-400" />,
    };
  }

  // 11. Diagram / Formula / Formel / Blueprint
  if (d.includes('diagram') || d.includes('formula') || d.includes('formel') || d.includes('blueprint')) {
    return {
      container: 'bg-[#061627] border-[#0284c7]/50 shadow-[0_12px_36px_rgba(2,132,199,0.2)] bg-blueprint-grid text-sky-100',
      headerBadge: 'text-sky-300 font-mono font-bold',
      frontAccent: 'border-l-4 border-[#38bdf8]',
      backAccent: 'border-l-4 border-[#fbbf24]',
      refBadge: 'bg-[#0c2a47] text-sky-200 border border-[#0369a1]',
      titleColor: 'text-white font-semibold',
      subColor: 'text-sky-300/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <GitBranch className="w-3.5 h-3.5 text-sky-400" />,
    };
  }

  // 12. Memory / Memory Palace / Mnemoteknikk
  if (d.includes('memory') || d.includes('minne')) {
    return {
      container: 'bg-[#160b24] border-fuchsia-500/45 shadow-[0_12px_36px_rgba(217,70,239,0.18)] text-fuchsia-50',
      headerBadge: 'text-fuchsia-300 font-bold',
      frontAccent: 'border-l-4 border-fuchsia-500',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#261038] text-fuchsia-200 border border-fuchsia-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-fuchsia-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />,
    };
  }

  // 13. Minimal / Swiss Minimalist
  if (d.includes('minimal')) {
    return {
      container: 'bg-[#0a0a0c] border-neutral-700/80 shadow-2xl text-neutral-100',
      headerBadge: 'text-neutral-300 font-semibold',
      frontAccent: 'border-l-4 border-neutral-100',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-neutral-900 text-neutral-300 border border-neutral-700',
      titleColor: 'text-white font-semibold tracking-wide',
      subColor: 'text-neutral-400',
      fontClass: 'font-sans',
      isLight: false,
      icon: <BookOpen className="w-3.5 h-3.5 text-neutral-300" />,
    };
  }

  // 14. High Contrast (WCAG AAA)
  if (d.includes('high contrast') || d.includes('kontrast')) {
    return {
      container: 'bg-black border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.25)] text-white',
      headerBadge: 'text-yellow-300 font-extrabold',
      frontAccent: 'border-l-4 border-yellow-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-zinc-950 text-yellow-300 border-2 border-yellow-400/80',
      titleColor: 'text-yellow-300 font-black',
      subColor: 'text-white',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Scale className="w-3.5 h-3.5 text-yellow-300" />,
    };
  }

  // 15. Glass / Glassmorphism
  if (d.includes('glass')) {
    return {
      container: 'bg-slate-900/70 backdrop-blur-xl border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-white',
      headerBadge: 'text-sky-300 font-bold',
      frontAccent: 'border-l-4 border-sky-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-white/10 text-white border border-white/20',
      titleColor: 'text-white font-bold',
      subColor: 'text-slate-200',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Sparkles className="w-3.5 h-3.5 text-sky-300" />,
    };
  }

  // 16. Microbiology / Biologi
  if (d.includes('microbiology') || d.includes('biologi')) {
    return {
      container: 'bg-[#05170f] border-emerald-500/40 shadow-[0_12px_36px_rgba(16,185,129,0.18)] text-emerald-50',
      headerBadge: 'text-emerald-300 font-bold',
      frontAccent: 'border-l-4 border-emerald-400',
      backAccent: 'border-l-4 border-teal-400',
      refBadge: 'bg-[#0b2418] text-emerald-200 border border-emerald-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-emerald-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />,
    };
  }

  // 17. Psychology / Psykologi
  if (d.includes('psychology') || d.includes('psykologi')) {
    return {
      container: 'bg-[#130d22] border-purple-500/40 shadow-[0_12px_36px_rgba(168,85,247,0.16)] text-purple-50',
      headerBadge: 'text-purple-300 font-bold',
      frontAccent: 'border-l-4 border-purple-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#1e1533] text-purple-200 border border-purple-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-purple-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Heart className="w-3.5 h-3.5 text-purple-400" />,
    };
  }

  // 18. Quick Recall
  if (d.includes('quick') || d.includes('hurtig')) {
    return {
      container: 'bg-[#0c1520] border-lime-500/40 shadow-[0_12px_32px_rgba(163,230,53,0.15)] text-lime-50',
      headerBadge: 'text-lime-300 font-bold',
      frontAccent: 'border-l-4 border-lime-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#152310] text-lime-200 border border-lime-600/40',
      titleColor: 'text-white font-black',
      subColor: 'text-lime-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <Zap className="w-3.5 h-3.5 text-lime-400" />,
    };
  }

  // 19. Deep Recall
  if (d.includes('deep') || d.includes('dyp')) {
    return {
      container: 'bg-[#030e1d] border-blue-600/45 shadow-[0_12px_36px_rgba(37,99,235,0.2)] text-blue-50',
      headerBadge: 'text-blue-300 font-bold',
      frontAccent: 'border-l-4 border-blue-400',
      backAccent: 'border-l-4 border-emerald-400',
      refBadge: 'bg-[#071933] text-blue-200 border border-blue-600/40',
      titleColor: 'text-white font-bold',
      subColor: 'text-blue-200/80',
      fontClass: 'font-sans',
      isLight: false,
      icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" />,
    };
  }

  // Default: Nordic (Skandinavisk arktisk eleganse)
  return {
    container: 'bg-[#0c1424] border-slate-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.55)] text-slate-100',
    headerBadge: 'text-sky-300 font-bold',
    frontAccent: 'border-l-4 border-sky-400',
    backAccent: 'border-l-4 border-emerald-400',
    refBadge: 'bg-[#0b172a] text-sky-200 border border-slate-700',
    titleColor: 'text-white font-bold',
    subColor: 'text-slate-300',
    fontClass: 'font-nordic',
    isLight: false,
    icon: <Sparkles className="w-3.5 h-3.5 text-sky-400" />,
  };
}

interface CardVisualProps {
  card: Flashcard;
  theme?: CardThemeName | string;
  isFlipped?: boolean;
  onFlip?: () => void;
  interactive?: boolean;
  showDesignBadge?: boolean;
  className?: string;
  forceTheme?: CardDesignFamily | string;
  onToggleFavorite?: (cardId: string) => void;
}

export const CardVisual: React.FC<CardVisualProps> = ({
  card,
  theme,
  isFlipped: controlledFlipped,
  onFlip,
  interactive = true,
  showDesignBadge = true,
  className = '',
  forceTheme,
  onToggleFavorite,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const currentDesign = (theme || forceTheme || card.design || 'Modern') as string;
  const cardTheme = resolveCardTheme(currentDesign);
  const styles = getFlashcardDesignStyles(currentDesign);

  const handleCardClick = () => {
    if (!interactive) return;
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  const speakText = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'no-NO';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Content mapping
  const questionText = card.forside || card.question;
  const answerText = card.bakside || card.answer;
  const rawDirect = cleanReferenceArtifacts(card.referansehenvisning || card.reference || '');
  const apa = formatToApa7Reference(rawDirect, card.kildedokument, card.kildeseksjon, card.kategori);
  const refDirect = apa.inText;
  const refFull = card.fullReferanse ? cleanReferenceArtifacts(card.fullReferanse) : apa.fullReference;

  // Resolve anatomical or pedagogical illustration based on authoritative medical literature
  const combinedContext = `${card.forside || card.question || ''} ${card.bakside || card.answer || ''} ${card.kategori || ''} ${card.emne || ''}`;
  const isAnatomyTopic = Boolean(
    combinedContext.match(/hjerte|cor|atrium|ventrik|klaff|valva|aorta|blodomløp|sirkulasjon|kretsløp|skjelett|knokkel|bein|ben|cranium|femur|tibia|fibula|humerus|radius|ulna|patella|clavicula|sternum|costae|pelvis|hodeskalle|lunge|pulmo|respirasjon|alveol|trachea|bronk|abcde|stemi|ekg|gcs|sepsis/i)
  );

  interface ResolvedImageItem {
    url?: string;
    svgContent?: string;
    alt?: string;
    position?: 'back' | 'side' | 'top' | 'front';
    isIllustrationNotice?: boolean;
  }

  const baseImage = card.bildeData || card.image;
  const imageItem: ResolvedImageItem | undefined = baseImage
    ? {
        url: baseImage.url,
        svgContent: baseImage.svgContent,
        alt: baseImage.alt,
        position: baseImage.position,
        isIllustrationNotice: (baseImage as any).isIllustrationNotice,
      }
    : isAnatomyTopic
    ? {
        svgContent: getDeterministicSvgForTopic(combinedContext, card.korttype),
        alt: 'Anatomisk og faglig illustrasjon (Terminologia Anatomica)',
        isIllustrationNotice: true,
        position: 'top',
      }
    : undefined;

  return (
    <div
      onClick={handleCardClick}
      className={`relative w-full min-h-[420px] max-w-xl mx-auto ${cardTheme.borders.container} ${cardTheme.spacing.padding} ${cardTheme.containerClasses} ${cardTheme.typography.fontFamily} flex flex-col justify-between transition-all duration-300 select-none ${
        interactive ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
      } ${className}`}
    >
      {/* Top Header Metadata Bar */}
      <div className={`flex items-center justify-between gap-2 ${cardTheme.spacing.headerMargin} ${cardTheme.borders.divider}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Kort-ID */}
          <span className={`px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10 ${cardTheme.typography.badge}`}>
            {card.id}
          </span>

          {/* Design family badge */}
          {showDesignBadge && (
            <span className={`tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${cardTheme.headerBadgeClasses} ${cardTheme.typography.badge}`}>
              {styles.icon}
              {cardTheme.name}
            </span>
          )}

          {/* Quality Audit Badge */}
          {card.qualityAudit?.passedAll ? (
            <span
              title="100% Kildevalidert og Verifisert"
              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Verifisert
            </span>
          ) : (
            <span
              title="Kortet er flagget for kontroll"
              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5"
            >
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Kontroll
            </span>
          )}
        </div>

        {/* Action icons (Speech & Flip indicator) */}
        <div className="flex items-center gap-1.5">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(card.id);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                card.isFavorite
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Favoritt"
            >
              <Star className={`w-3.5 h-3.5 ${card.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            onClick={(e) => speakText(e, !isFlipped ? questionText : answerText)}
            title="Les høyt (Norsk tekst-til-tale)"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md font-mono">
            <RotateCcw className="w-3 h-3" />
            {isFlipped ? 'Bak' : 'Foran'}
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className={`flex-1 flex flex-col justify-center py-4 ${cardTheme.spacing.contentGap}`}>
        {!isFlipped ? (
          /* FORSIDE (SPØRSMÅL / CASE) */
          <div className={cardTheme.frontAccentClasses}>
            <div className={`flex items-center justify-between ${cardTheme.typography.header}`}>
              <span>SPØRSMÅL / CASE</span>
              {card.kategori && (
                <span className="opacity-75 font-normal">
                  {card.kategori} &bull; {card.emne}
                </span>
              )}
            </div>

            <h3 className={cardTheme.typography.question}>
              {questionText}
            </h3>

            {card.frontExtra && (
              <p className={cardTheme.typography.subText}>
                Kontekst / Hint: {card.frontExtra}
              </p>
            )}

            {/* Illustration (only when beneficial according to Requirement 4) */}
            {imageItem && imageItem.position !== 'back' && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageExpanded(true);
                }}
                className="pt-2 flex flex-col items-center cursor-zoom-in group/img w-full"
                title="Trykk for å forstørre anatomisk plansje (Norsk & Latin)"
              >
                <div className="relative w-full max-h-36 sm:max-h-44 p-1 rounded-xl bg-black/40 border border-white/10 group-hover/img:border-sky-500/60 transition-all flex items-center justify-center overflow-hidden">
                  {imageItem.svgContent ? (
                    <div
                      className="w-full h-full max-h-36 sm:max-h-40 flex items-center justify-center pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: imageItem.svgContent }}
                    />
                  ) : imageItem.url ? (
                    <img
                      src={imageItem.url}
                      alt={imageItem.alt || 'Kortillustrasjon'}
                      className="max-h-36 sm:max-h-40 object-contain rounded-lg"
                    />
                  ) : null}
                  <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/75 text-sky-300 opacity-80 group-hover/img:opacity-100 flex items-center gap-1 text-[10px] font-bold border border-white/10">
                    <Maximize2 className="w-3 h-3" />
                    <span>Forstørr</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1">
                  <span className="text-sky-400 font-bold">&bull;</span>
                  {imageItem.alt || 'Anatomisk plansje (Terminologia Anatomica)'} &bull; Trykk for full visning
                </span>
              </div>
            )}
          </div>
        ) : (
          /* BAKSIDE (SPØRSMÅL/BEGREP ØVERST, SÅ KORREKT SVAR & FORKLARING UNDER) */
          <div className={cardTheme.backAccentClasses}>
            {/* Term/Question header on back so the user always sees what is being explained */}
            <div className={`pb-2 ${cardTheme.borders.divider} space-y-0.5`}>
              <span className={`block ${cardTheme.typography.header}`}>
                Spørsmål / Begrep:
              </span>
              <p className={cardTheme.typography.context}>
                {questionText}
              </p>
            </div>

            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>KORREKT SVAR & FORKLARING</span>
            </div>

            <div className={cardTheme.typography.answer}>
              {answerText}
            </div>

            {card.backExtra && (
              <div className={`pt-2 ${cardTheme.borders.divider} ${cardTheme.typography.subText}`}>
                <span className="font-semibold block mb-0.5">Utdyping:</span>
                {card.backExtra}
              </div>
            )}

            {/* Illustration on back */}
            {imageItem && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageExpanded(true);
                }}
                className="pt-2 flex flex-col items-center cursor-zoom-in group/img w-full"
                title="Trykk for å forstørre anatomisk plansje (Norsk & Latin)"
              >
                <div className="relative w-full max-h-32 sm:max-h-40 p-1 rounded-xl bg-black/40 border border-white/10 group-hover/img:border-emerald-500/60 transition-all flex items-center justify-center overflow-hidden">
                  {imageItem.svgContent ? (
                    <div
                      className="w-full h-full max-h-32 sm:max-h-36 flex items-center justify-center pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: imageItem.svgContent }}
                    />
                  ) : imageItem.url ? (
                    <img
                      src={imageItem.url}
                      alt={imageItem.alt || 'Kortillustrasjon'}
                      className="max-h-32 sm:max-h-36 object-contain rounded-lg"
                    />
                  ) : null}
                  <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/75 text-emerald-300 opacity-80 group-hover/img:opacity-100 flex items-center gap-1 text-[10px] font-bold border border-white/10">
                    <Maximize2 className="w-3 h-3" />
                    <span>Forstørr</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">&bull;</span>
                  Faglig plansje &bull; Trykk for detaljer
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar: ONLY on backside (REFERANSER SKAL ALDRI VISES PÅ FORSIDEN) */}
      <div className={`${cardTheme.spacing.footerPadding} ${cardTheme.borders.divider} space-y-1.5`}>
        {isFlipped ? (
          <>
            <div className={`flex items-center justify-between ${cardTheme.refBadgeClasses} ${cardTheme.typography.reference}`}>
              <div className="flex items-center gap-2 truncate">
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                <span className="font-semibold flex-shrink-0">REFERANSE:</span>
                <span className="truncate opacity-95">{refDirect}</span>
              </div>

              {card.kildeseksjon && (
                <span className="text-[10px] opacity-75 font-mono hidden sm:inline ml-2 flex-shrink-0">
                  {card.kildeseksjon}
                </span>
              )}
            </div>

            {refFull && refFull !== refDirect && (
              <div className="text-[10px] text-slate-400 italic px-2 truncate" title={refFull}>
                Full kilde: {refFull}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 py-1">
            <span>Trykk på kortet for å snu og se svar + referanse</span>
            <span className="font-mono text-[10px] opacity-70">Mellomrom</span>
          </div>
        )}
      </div>

      {/* Zoom Modal for Anatomical / Pedagogical Illustration */}
      {isImageExpanded && imageItem && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={(e) => {
            e.stopPropagation();
            setIsImageExpanded(false);
          }}
        >
          <div
            className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Anatomisk Fagplansje (Norsk &amp; Latin)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Terminologia Anatomica &bull; Norske og latinske fagbetegnelser &bull; 100% Kildebasert
                </p>
              </div>
              <button
                onClick={() => setIsImageExpanded(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Lukk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-80 sm:h-96 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-3 border border-slate-800/80">
              {imageItem.svgContent ? (
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: imageItem.svgContent }}
                />
              ) : (
                <img
                  src={imageItem.url}
                  alt={imageItem.alt}
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="truncate max-w-xs">{card.forside || card.question}</span>
              <button
                onClick={() => setIsImageExpanded(false)}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
              >
                Lukk visning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
