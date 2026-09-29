import React, { useState, useMemo, useCallback } from 'react';
import { Flashcard, Deck, CardDesignFamily, Korttype, Niva } from '../types/flashcard';
import { CardVisual, getFlashcardDesignStyles } from './CardVisual';
import { cleanReferenceArtifacts, formatToApa7Reference } from '../utils/referenceFormatter';
import {
  Search,
  Filter,
  Sparkles,
  Plus,
  BookOpen,
  Layers,
  Star,
  RotateCw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Copy,
  Check,
  ArrowUpDown,
  LayoutGrid,
  List,
  Download,
  Eye,
  Play,
  ShieldCheck,
  Palette,
} from 'lucide-react';

interface CardLibraryViewProps {
  cards: Flashcard[];
  decks: Deck[];
  onOpenNewCard: () => void;
  onEditCard: (card: Flashcard) => void;
  onToggleFavorite: (cardId: string) => void;
  onStartStudyWithCards?: (selectedCards: Flashcard[]) => void;
  onOpenExportModal?: (deck: Deck) => void;
  globalDesignTheme?: string;
  onSelectDesignTheme?: (theme: string) => void;
}

export const CardLibraryView: React.FC<CardLibraryViewProps> = ({
  cards,
  decks,
  onOpenNewCard,
  onEditCard,
  onToggleFavorite,
  onStartStudyWithCards,
  onOpenExportModal,
  globalDesignTheme,
  onSelectDesignTheme,
}) => {
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [designFilter, setDesignFilter] = useState('all');
  const [activeDesignTheme, setActiveDesignTheme] = useState<string>(globalDesignTheme || 'auto');
  const [variantFilter, setVariantFilter] = useState<'all' | 'original' | 'variant' | 'favorites' | 'needs_review'>('all');
  const [sortBy, setSortBy] = useState<'id_asc' | 'id_desc' | 'question_asc' | 'category_asc' | 'box_asc'>('id_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Chunk loading for buttery 60fps performance with 2104+ / 2604+ / 10,000+ cards
  const [visibleCount, setVisibleCount] = useState(48);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flipped card IDs in memory
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flipAllCards = (flipToBack: boolean) => {
    if (flipToBack) {
      setFlippedIds(new Set(filteredCards.map((c) => c.id)));
    } else {
      setFlippedIds(new Set());
    }
  };

  // Distinct stats: Original vs Variant
  const stats = useMemo(() => {
    let originalCount = 0;
    let variantCount = 0;
    let favoriteCount = 0;
    let reviewCount = 0;

    for (const c of cards) {
      const isVariant = Boolean(c.variantId || c.originalKortId || c.id.includes('-V'));
      if (isVariant) variantCount++;
      else originalCount++;

      if (c.isFavorite) favoriteCount++;
      if (c.status === 'KREVER_KONTROLL' || c.status === 'USIKKER_KOBLING') reviewCount++;
    }

    return {
      total: cards.length,
      originalCount,
      variantCount,
      favoriteCount,
      reviewCount,
    };
  }, [cards]);

  // Unique categories, types and designs
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.kategori).filter(Boolean))).sort();
  }, [cards]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.korttype).filter(Boolean))).sort();
  }, [cards]);

  const uniqueDesigns = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.design).filter(Boolean))).sort();
  }, [cards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return cards
      .filter((c) => {
        // Variant filter
        const isVariant = Boolean(c.variantId || c.originalKortId || c.id.includes('-V'));
        if (variantFilter === 'original' && isVariant) return false;
        if (variantFilter === 'variant' && !isVariant) return false;
        if (variantFilter === 'favorites' && !c.isFavorite) return false;
        if (variantFilter === 'needs_review' && c.status !== 'KREVER_KONTROLL' && c.status !== 'USIKKER_KOBLING') return false;

        // Dropdown filters
        if (categoryFilter !== 'all' && c.kategori !== categoryFilter) return false;
        if (typeFilter !== 'all' && c.korttype !== typeFilter) return false;
        if (levelFilter !== 'all' && c.niva !== levelFilter) return false;
        if (designFilter !== 'all' && c.design !== designFilter) return false;

        // Search query
        if (q) {
          const matchText = `${c.id} ${c.forside || c.question} ${c.bakside || c.answer} ${c.referansehenvisning || c.reference} ${c.kategori} ${c.emne || ''} ${(c.tagger || []).join(' ')}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'id_asc') return a.id.localeCompare(b.id, undefined, { numeric: true });
        if (sortBy === 'id_desc') return b.id.localeCompare(a.id, undefined, { numeric: true });
        if (sortBy === 'question_asc') return (a.forside || a.question).localeCompare(b.forside || b.question);
        if (sortBy === 'category_asc') return (a.kategori || '').localeCompare(b.kategori || '');
        if (sortBy === 'box_asc') return (a.srs?.box || 1) - (b.srs?.box || 1);
        return 0;
      });
  }, [cards, searchQuery, categoryFilter, typeFilter, levelFilter, designFilter, variantFilter, sortBy]);

  // Read aloud helper
  const speakCard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'no-NO';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy helper
  const copyCardText = (e: React.MouseEvent, card: Flashcard) => {
    e.stopPropagation();
    const text = `Kort-ID: ${card.id}\nSpørsmål: ${card.forside || card.question}\nSvar: ${card.bakside || card.answer}\nKilde (APA 7): ${card.referansehenvisning || card.reference}`;
    navigator.clipboard.writeText(text);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Kortbibliotek
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Komplett samling med ekte forside/bakside-kort &bull; Ingen 200-korts begrensning &bull; 100% kildebaserte APA 7 referanser
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onStartStudyWithCards && filteredCards.length > 0 && (
            <button
              onClick={() => onStartStudyWithCards(filteredCards)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
              title="Start studering med alle kort i dette utvalget"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Studer utvalg ({filteredCards.length})</span>
            </button>
          )}

          {onOpenExportModal && (
            <button
              onClick={() =>
                onOpenExportModal({
                  id: 'filtered',
                  title: `Bibliotekutvalg (${filteredCards.length} kort)`,
                  description: 'Eksportert fra FlashForge kortbibliotek',
                  tags: ['bibliotek'],
                  defaultDesign: (activeDesignTheme !== 'auto' ? activeDesignTheme : 'Nordic') as any,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                })
              }
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksporter</span>
            </button>
          )}

          <button
            onClick={onOpenNewCard}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nytt kort</span>
          </button>
        </div>
      </div>

      {/* 2. Dataset Metrics Bar: 2104 Originalkort | 500 Varianter | 2604 Totalt */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setVariantFilter('all')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            variantFilter === 'all'
              ? 'bg-slate-800/90 border-sky-500 shadow-md shadow-sky-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Totalt antall</div>
          <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{stats.total}</div>
          <div className="text-[10px] text-sky-400 font-semibold mt-0.5">Alle registrerte kort</div>
        </button>

        <button
          onClick={() => setVariantFilter('original')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            variantFilter === 'original'
              ? 'bg-slate-800/90 border-blue-500 shadow-md shadow-blue-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Originalkort</div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">{stats.originalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kildekort fra master</div>
        </button>

        <button
          onClick={() => setVariantFilter('variant')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            variantFilter === 'variant'
              ? 'bg-slate-800/90 border-purple-500 shadow-md shadow-purple-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Læringsvarianter</div>
          <div className="text-xl sm:text-2xl font-black text-purple-400 mt-0.5">{stats.variantCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Case, eksamen, recall</div>
        </button>

        <button
          onClick={() => setVariantFilter('favorites')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            variantFilter === 'favorites'
              ? 'bg-slate-800/90 border-amber-500 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Favoritter</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">{stats.favoriteCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Stjernemerket</div>
        </button>

        <button
          onClick={() => setVariantFilter('needs_review')}
          className={`col-span-2 sm:col-span-1 p-3 rounded-2xl border text-left transition-all ${
            variantFilter === 'needs_review'
              ? 'bg-slate-800/90 border-rose-500 shadow-md shadow-rose-500/10'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kontrollkort</div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 mt-0.5">{stats.reviewCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kildevalidering</div>
        </button>
      </div>

      {/* 3. Search and Multi-Filter Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(48);
              }}
              placeholder="Søk i spørsmål, svar, Kort-ID eller APA 7 referanser..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setVisibleCount(48);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">Alle kategorier ({uniqueCategories.length})</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="id_asc">Kort-ID (Lavest først)</option>
              <option value="id_desc">Kort-ID (Høyest først)</option>
              <option value="question_asc">Spørsmål (A–Å)</option>
              <option value="category_asc">Kategori (A–Å)</option>
              <option value="box_asc">Leitner-boks (Repetisjon)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-sky-400" /> Filter:
            </span>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs"
            >
              <option value="all">Alle korttyper</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs"
            >
              <option value="all">Alle nivåer</option>
              <option value="Grunnleggende">Grunnleggende</option>
              <option value="Middels">Middels</option>
              <option value="Avansert">Avansert</option>
            </select>

            {/* Design Filter */}
            <select
              value={designFilter}
              onChange={(e) => setDesignFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs"
            >
              <option value="all">Alle filterdesign</option>
              {uniqueDesigns.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Active Card Visual Design Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-indigo-500/40 text-xs">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-semibold">Visuell stil:</span>
              <select
                value={activeDesignTheme}
                onChange={(e) => {
                  setActiveDesignTheme(e.target.value);
                  if (onSelectDesignTheme) onSelectDesignTheme(e.target.value);
                }}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="auto" className="bg-slate-900 text-white">Auto (Kortets eget designtema)</option>
                <option value="Nordic" className="bg-slate-900 text-white">Nordic Modern (Arktisk blå)</option>
                <option value="Clinical" className="bg-slate-900 text-white">Clinical Studio (Klinisk teal)</option>
                <option value="Dark Premium" className="bg-slate-900 text-white">Obsidian Gold (Luksus)</option>
                <option value="Light Premium" className="bg-slate-900 text-white">Studio Ivory (Lys daglesing)</option>
                <option value="Swiss Minimal" className="bg-slate-900 text-white">Swiss Minimal (Monokrom)</option>
                <option value="Academic" className="bg-slate-900 text-white">Oxford Academic (Serif)</option>
                <option value="Cyber Blueprint" className="bg-slate-900 text-white">Cyber Blueprint (Skjema)</option>
                <option value="Emergency" className="bg-slate-900 text-white">Trauma Emergency (Rød)</option>
                <option value="Medication" className="bg-slate-900 text-white">Pharmacology Mint (Apotek)</option>
                <option value="Deep Recall" className="bg-slate-900 text-white">Deep Recall (Dyp safir)</option>
                <option value="High Contrast" className="bg-slate-900 text-white">High Contrast AAA (Sort/gul)</option>
              </select>
            </div>

            {(searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' || levelFilter !== 'all' || designFilter !== 'all' || variantFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setLevelFilter('all');
                  setDesignFilter('all');
                  setVariantFilter('all');
                }}
                className="text-sky-400 hover:text-sky-300 underline font-semibold ml-1"
              >
                Nullstill alle filtre
              </button>
            )}
          </div>

          {/* Quick Flip All & View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => flipAllCards(flippedIds.size === 0)}
              className="px-3 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 border border-slate-700/80 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              <span>{flippedIds.size === 0 ? 'Snu alle til svar' : 'Snu alle til forside'}</span>
            </button>

            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Kortgrid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition-colors ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Kompakt tabell"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter Results Status */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Viser <strong className="text-white font-mono">{Math.min(visibleCount, filteredCards.length)}</strong> av{' '}
          <strong className="text-sky-400 font-mono">{filteredCards.length}</strong> kort som matcher filteret
          {filteredCards.length !== cards.length && (
            <span className="text-slate-500"> (av totalt {cards.length} i biblioteket)</span>
          )}
        </div>

        {filteredCards.length > 0 && (
          <div className="text-[11px] text-slate-500">
            Trykk på et kort for å snu mellom forside og bakside
          </div>
        )}
      </div>

      {/* 5. Main Card Display */}
      {filteredCards.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Ingen kort matcher søkekriteriene</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Prøv et annet søkeord eller tilbakestill filtrene for å vise hele samlingen på {cards.length} kort.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setTypeFilter('all');
              setLevelFilter('all');
              setDesignFilter('all');
              setVariantFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors"
          >
            Vis alle {cards.length} kort
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: Responsive Modern Flashcard Grid with Consistent Height */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCards.slice(0, visibleCount).map((card) => {
              const isFlipped = flippedIds.has(card.id);
              const isVariant = Boolean(card.variantId || card.originalKortId || card.id.includes('-V'));
              const cardTheme = activeDesignTheme === 'auto' ? (card.design || 'Nordic') : activeDesignTheme;
              const styles = getFlashcardDesignStyles(cardTheme);

              const rawRef = cleanReferenceArtifacts(card.referansehenvisning || card.reference || '');
              const apa = formatToApa7Reference(rawRef, card.kildedokument, card.kildeseksjon, card.kategori);

              return (
                <div
                  key={card.id}
                  onClick={() => toggleFlip(card.id)}
                  className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between p-5 min-h-[310px] h-[330px] select-none overflow-hidden hover:-translate-y-0.5 ${
                    styles.container
                  } ${styles.fontClass} ${
                    isFlipped
                      ? 'shadow-[0_12px_36px_rgba(16,185,129,0.18)]'
                      : 'shadow-[0_10px_30px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {/* Top Metadata Row: Zero-pill discipline with clean unboxed text and dot separators */}
                  <div className={`flex items-center justify-between gap-2 pb-2.5 border-b ${styles.isLight ? 'border-slate-300/70' : 'border-white/10'} flex-shrink-0`}>
                    <div className="flex items-center gap-1.5 text-xs truncate">
                      <span className="font-mono font-bold tracking-tight text-[11px] opacity-90">
                        {card.id}
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 ${styles.headerBadge}`}>
                        {styles.icon}
                        {cardTheme}
                      </span>
                      {isVariant && (
                        <>
                          <span aria-hidden="true" className="opacity-40">·</span>
                          <span className="text-[10px] font-medium opacity-80">
                            {card.korttype || 'Variant'}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleFavorite(card.id)}
                        className={`p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                          card.isFavorite ? 'text-amber-400' : 'opacity-60 hover:opacity-100'
                        }`}
                        title={card.isFavorite ? 'Fjern favoritt' : 'Legg til favoritt'}
                      >
                        <Star className={`w-3.5 h-3.5 ${card.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => speakCard(e, isFlipped ? card.bakside || card.answer : card.forside || card.question)}
                        className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        title="Les høyt (Norsk TTS)"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => copyCardText(e, card)}
                        className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        title="Kopier korttekst"
                      >
                        {copiedId === card.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onEditCard(card)}
                        className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        title="Rediger kort"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Card Content */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 custom-scrollbar">
                    {!isFlipped ? (
                      /* FORSIDE: Kun rent spørsmål/case. REFERANSER SKAL ALDRI VISES PÅ FORSIDEN. */
                      <div className={`space-y-2.5 ${styles.frontAccent} pl-3.5`}>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-85">
                          <span>SPØRSMÅL / BEGREP</span>
                          <span className="font-normal opacity-70 truncate max-w-[130px]">
                            {card.kategori}
                          </span>
                        </div>
                        <h4 className={`text-base sm:text-lg leading-snug ${styles.titleColor}`}>
                          {card.forside || card.question}
                        </h4>
                        {card.frontExtra && (
                          <p className={`text-xs italic opacity-80 ${styles.subColor}`}>
                            Kontekst / Hint: {card.frontExtra}
                          </p>
                        )}
                      </div>
                    ) : (
                      /* BAKSIDE: Spørsmål øverst som referanse, så KORREKT SVAR og FORKLARING */
                      <div className={`space-y-2.5 ${styles.backAccent} pl-3.5`}>
                        <div className={`text-[11px] truncate pb-1.5 border-b ${styles.isLight ? 'border-slate-300/70' : 'border-white/10'} opacity-85`}>
                          <span className="font-bold uppercase tracking-wider mr-1 text-[10px] text-sky-500">Begrep:</span>
                          <span className="font-medium">{card.forside || card.question}</span>
                        </div>

                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>KORREKT SVAR & FORKLARING</span>
                        </div>

                        <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${styles.titleColor}`}>
                          {card.bakside || card.answer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: APA 7 Referanse STRICTLY på baksiden */}
                  <div className={`pt-2.5 border-t ${styles.isLight ? 'border-slate-300/70' : 'border-white/10'} flex items-center justify-between text-[11px] flex-shrink-0`}>
                    {isFlipped ? (
                      <div
                        className={`truncate px-2.5 py-1 rounded-lg text-[10px] max-w-full font-medium ${styles.refBadge}`}
                        title={card.fullReferanse || apa.fullReference}
                      >
                        <span className="font-bold mr-1">Kilde (APA 7):</span>
                        <span>{apa.inText}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full opacity-60 text-[10px]">
                        <span>{card.emne || card.kategori}</span>
                        <span className="font-medium group-hover:opacity-100 transition-opacity">
                          Trykk for å se svar &rarr;
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lazy Load More / Show All Pagination Bar */}
          {filteredCards.length > visibleCount && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-slate-900 border border-slate-800 gap-4 shadow-xl">
              <span className="text-xs text-slate-400">
                Viser <strong className="text-white font-mono">{visibleCount}</strong> av{' '}
                <strong className="text-sky-400 font-mono">{filteredCards.length}</strong> kort
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 48, filteredCards.length))}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
                >
                  Vis 48 flere kort
                </button>

                <button
                  onClick={() => setVisibleCount(filteredCards.length)}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/25 transition-all"
                >
                  Vis alle ({filteredCards.length})
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW: Compact dense view for large card repositories */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kort-ID</th>
                  <th className="py-3 px-4">Kategori / Emne</th>
                  <th className="py-3 px-4">Spørsmål (Forside)</th>
                  <th className="py-3 px-4">Svar (Bakside)</th>
                  <th className="py-3 px-4">Kilde (APA 7)</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {filteredCards.slice(0, visibleCount).map((card) => {
                  const isVariant = Boolean(card.variantId || card.originalKortId || card.id.includes('-V'));
                  return (
                    <tr key={card.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                        {card.id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-white block">{card.kategori}</span>
                        <span className="text-[10px] text-slate-400">{card.emne || ''}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate font-medium text-white">
                        {card.forside || card.question}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-300">
                        {card.bakside || card.answer}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-sky-300">
                        {card.referansehenvisning || card.reference}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isVariant ? (
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-700/50">
                            Variant
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-300 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-700/50">
                            Original
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onEditCard(card)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white mr-1"
                          title="Rediger"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCards.length > visibleCount && (
            <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950 text-xs">
              <span className="text-slate-400">
                Viser {visibleCount} av {filteredCards.length} rader
              </span>
              <button
                onClick={() => setVisibleCount((prev) => Math.min(prev + 100, filteredCards.length))}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Last inn 100 flere rader...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
