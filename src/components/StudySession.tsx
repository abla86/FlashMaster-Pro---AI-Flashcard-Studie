import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard, Deck, StudySessionResult } from '../types/flashcard';
import { CardVisual } from './CardVisual';
import { calculateNextSRS, updateStatsAfterReview, saveSessionResult, saveCards } from '../utils/storage';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Star,
  Shuffle,
  Filter,
  Flame,
  Info,
  Palette,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudySessionProps {
  deck: Deck;
  cards: Flashcard[];
  onFinish: () => void;
  onUpdateCards: (updatedCards: Flashcard[]) => void;
  activeDesignTheme?: string;
}

export type StudyFilterMode = 'all' | 'weak' | 'favorites' | 'cases';

export const StudySession: React.FC<StudySessionProps> = ({
  deck,
  cards,
  onFinish,
  onUpdateCards,
  activeDesignTheme = 'auto',
}) => {
  const [filterMode, setFilterMode] = useState<StudyFilterMode>('all');
  const [sessionTheme, setSessionTheme] = useState<string>(activeDesignTheme);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionRatings, setSessionRatings] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    skippedRating: 0,
  });
  const [startTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);

  // Initialize and filter study queue
  useEffect(() => {
    let pool = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

    if (filterMode === 'weak') {
      pool = pool.filter((c) => (c.srs?.box || 1) <= 2);
    } else if (filterMode === 'favorites') {
      pool = pool.filter((c) => c.isFavorite);
    } else if (filterMode === 'cases') {
      pool = pool.filter(
        (c) =>
          c.korttype === 'Case' ||
          c.design === 'Case' ||
          c.forside.toLowerCase().includes('pasient') ||
          c.forside.toLowerCase().includes('scenario')
      );
    }

    // Default: prioritize due cards or box 1, then shuffle gently
    const sorted = [...pool].sort((a, b) => (a.srs?.box || 1) - (b.srs?.box || 1));
    setStudyQueue(sorted.length > 0 ? sorted : pool);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [deck.id, cards, filterMode]);

  const currentCard = studyQueue[currentIndex];

  // Advance to next card (without forced rating)
  const handleNextCard = useCallback(() => {
    if (currentIndex + 1 < studyQueue.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // Session finished
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const result: StudySessionResult = {
        deckId: deck.id,
        cardsReviewed: studyQueue.length,
        ratings: sessionRatings,
        durationSeconds,
        timestamp: Date.now(),
      };
      saveSessionResult(result);
      setIsFinished(true);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [currentIndex, studyQueue.length, startTime, deck.id, sessionRatings]);

  // Go to previous card
  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  // Toggle favorite for current card
  const handleToggleFavorite = (cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = cards.map((c) => (c.id === cardId ? { ...c, isFavorite: !c.isFavorite } : c));
    onUpdateCards(updated);
    saveCards(updated);
  };

  // Shuffle current queue
  const handleShuffle = () => {
    const shuffled = [...studyQueue].sort(() => Math.random() - 0.5);
    setStudyQueue(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Optional rating handler
  const handleRate = useCallback(
    (rating: 'again' | 'hard' | 'good' | 'easy') => {
      if (!currentCard) return;

      const currentSRS = currentCard.srs || {
        box: 1,
        repetitionCount: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        dueDate: Date.now(),
        history: [],
      };

      const updatedSRS = calculateNextSRS(currentSRS, rating);
      const updatedCard: Flashcard = {
        ...currentCard,
        srs: updatedSRS,
        updatedAt: Date.now(),
      };

      // Save locally
      const newAllCards = cards.map((c) => (c.id === currentCard.id ? updatedCard : c));
      onUpdateCards(newAllCards);
      saveCards(newAllCards);

      // Update stats with card context
      updateStatsAfterReview(rating, currentCard);

      // Record in session
      setSessionRatings((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      // Advance
      handleNextCard();
    },
    [currentCard, cards, onUpdateCards, handleNextCard]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          // If already flipped, space/enter advances to next card without forcing rating!
          handleNextCard();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCard();
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, handleRate, handleNextCard]);

  // Session Summary View
  if (isFinished) {
    const total = studyQueue.length;
    const ratedTotal = sessionRatings.again + sessionRatings.hard + sessionRatings.good + sessionRatings.easy;
    const correct = sessionRatings.good + sessionRatings.easy;
    const accuracy = ratedTotal > 0 ? Math.round((correct / ratedTotal) * 100) : 100;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    return (
      <div className="max-w-xl mx-auto my-8 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
          <Award className="w-8 h-8 text-amber-400" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">Økt Fullført!</h2>
          <p className="text-sm text-slate-400">
            Kortene er gjennomgått og all repetisjonshistorikk er lagret lokalt på din enhet.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold">Kort studert</span>
            <span className="text-2xl font-black text-white">{total}</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold">Mestring (vurdert)</span>
            <span className={`text-2xl font-black ${accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {accuracy}%
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold">Tid brukt</span>
            <span className="text-2xl font-black text-sky-400">{Math.round(timeSpent / 60)}m {timeSpent % 60}s</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsFinished(false);
              setCurrentIndex(0);
              setIsFlipped(false);
              setSessionRatings({ again: 0, hard: 0, good: 0, easy: 0, skippedRating: 0 });
            }}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start på nytt
          </button>

          <button
            onClick={onFinish}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            Tilbake til oversikt
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Ingen kort i dette utvalget</h3>
        <p className="text-xs text-slate-400">
          Det er ingen kort som matcher filteret &laquo;{filterMode}&raquo; for kortsettet &laquo;{deck.title}&raquo;.
        </p>
        <button
          onClick={() => setFilterMode('all')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          Vis alle kort i kortsettet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Top Header & Filters */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 truncate max-w-[160px] sm:max-w-xs">
            {deck.title}
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {currentIndex + 1}/{studyQueue.length}
          </span>
        </div>

        {/* Filter modes */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilterMode('weak')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'weak'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Svake
          </button>
          <button
            onClick={() => setFilterMode('favorites')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === 'favorites'
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            ★ Favoritter
          </button>
          <button
            onClick={handleShuffle}
            title="Stokk om kortene"
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {/* Theme switcher */}
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={sessionTheme}
              onChange={(e) => setSessionTheme(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="auto" className="bg-slate-900 text-white">Auto design</option>
              <option value="Nordic" className="bg-slate-900 text-white">Nordic</option>
              <option value="Clinical" className="bg-slate-900 text-white">Clinical</option>
              <option value="Dark Premium" className="bg-slate-900 text-white">Obsidian Gold</option>
              <option value="Light Premium" className="bg-slate-900 text-white">Studio Ivory (Lys)</option>
              <option value="Swiss Minimal" className="bg-slate-900 text-white">Swiss Minimal</option>
              <option value="Academic" className="bg-slate-900 text-white">Oxford Academic</option>
              <option value="Cyber Blueprint" className="bg-slate-900 text-white">Cyber Blueprint</option>
              <option value="Emergency" className="bg-slate-900 text-white">Trauma Emergency</option>
              <option value="Medication" className="bg-slate-900 text-white">Pharmacology</option>
              <option value="Deep Recall" className="bg-slate-900 text-white">Deep Recall</option>
              <option value="High Contrast" className="bg-slate-900 text-white">High Contrast AAA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-white">
            Kort {currentIndex + 1} av {studyQueue.length}
          </span>
          <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-sky-300">
            Leitner Boks {currentCard.srs?.box || 1} av 5
          </span>
        </div>

        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / studyQueue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Interactive Card */}
      <div className="relative group">
        <CardVisual
          card={currentCard}
          theme={sessionTheme !== 'auto' ? sessionTheme : undefined}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
          interactive={true}
        />

        {/* Favorite toggle star */}
        <button
          onClick={(e) => handleToggleFavorite(currentCard.id, e)}
          title={currentCard.isFavorite ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
          className={`absolute top-4 left-4 p-2 rounded-xl border backdrop-blur-md transition-all z-20 ${
            currentCard.isFavorite
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md'
              : 'bg-black/30 border-white/10 text-slate-400 hover:text-amber-300'
          }`}
        >
          <Star className={`w-4 h-4 ${currentCard.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Controls & Optional Rating Area */}
      <div className="space-y-3 pt-2">
        {!isFlipped ? (
          <div className="flex gap-2.5">
            <button
              onClick={handlePrevCard}
              disabled={currentIndex === 0}
              className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Forrige</span>
            </button>

            <button
              onClick={() => setIsFlipped(true)}
              className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <span>Vis Svar & Kilde (Mellomrom)</span>
            </button>

            <button
              onClick={handleNextCard}
              className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
              title="Hopp til neste kort uten å snu"
            >
              <span>Neste</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primary Instant Next Navigation */}
            <div className="flex gap-2.5">
              <button
                onClick={handlePrevCard}
                disabled={currentIndex === 0}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Forrige</span>
              </button>

              <button
                onClick={handleNextCard}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <span>Neste kort &rarr; (Mellomrom)</span>
              </button>
            </div>

            {/* Optional Leitner Difficulty Ratings */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between px-1">
                <span>Valgfri vurdering (for tilpasset repetisjon):</span>
                <span className="text-[10px] text-slate-500">Tast 1-4</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleRate('again')}
                  className="py-2.5 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 text-xs font-bold transition-colors flex flex-col items-center gap-0.5 shadow-sm"
                >
                  <span className="text-[9px] text-rose-400/80 font-mono">1</span>
                  <span>Glemte</span>
                  <span className="text-[9px] text-rose-300 font-normal">Boks 1</span>
                </button>

                <button
                  onClick={() => handleRate('hard')}
                  className="py-2.5 px-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 text-amber-300 text-xs font-bold transition-colors flex flex-col items-center gap-0.5 shadow-sm"
                >
                  <span className="text-[9px] text-amber-400/80 font-mono">2</span>
                  <span>Vanskelig</span>
                  <span className="text-[9px] text-amber-300 font-normal">Samme boks</span>
                </button>

                <button
                  onClick={() => handleRate('good')}
                  className="py-2.5 px-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs font-bold transition-colors flex flex-col items-center gap-0.5 shadow-sm"
                >
                  <span className="text-[9px] text-emerald-400/80 font-mono">3</span>
                  <span>Klarte det</span>
                  <span className="text-[9px] text-emerald-300 font-normal">+1 Boks</span>
                </button>

                <button
                  onClick={() => handleRate('easy')}
                  className="py-2.5 px-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/80 text-sky-300 text-xs font-bold transition-colors flex flex-col items-center gap-0.5 shadow-sm"
                >
                  <span className="text-[9px] text-sky-400/80 font-mono">4</span>
                  <span>Enkelt</span>
                  <span className="text-[9px] text-sky-300 font-normal">+1 Boks (Lett)</span>
                </button>
              </div>
            </div>

            {/* Informative notice per user specification */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Valgfritt:</strong> Du må ikke velge vanskelighetsgrad for å gå videre. Trykk <em>Neste kort &rarr;</em> direkte. Men hvis du velger hvor godt du husket det, er det enklere for FlashForge å tilpasse neste stokk og repetere svakere kort oftere.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
