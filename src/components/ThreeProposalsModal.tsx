import React, { useState } from 'react';
import { CardVariationProposal, Deck, Flashcard } from '../types/flashcard';
import { fetchOrGenerate3Proposals } from '../utils/proposalsEngine';
import { CardVisual } from './CardVisual';
import {
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ThreeProposalsModalProps {
  decks: Deck[];
  currentDeckId: string;
  isOfflineOnly: boolean;
  onAddCard: (card: Flashcard) => void;
  onAddAllCards: (cards: Flashcard[]) => void;
  onClose: () => void;
}

export const ThreeProposalsModal: React.FC<ThreeProposalsModalProps> = ({
  decks,
  currentDeckId,
  isOfflineOnly,
  onAddCard,
  onAddAllCards,
  onClose,
}) => {
  const [topic, setTopic] = useState('Hjerteinfarkt (STEMI / NSTEMI)');
  const [contextText, setContextText] = useState(
    'Kardiologi pensum: Akutt koronarsyndrom, troponinstigning, ST-elevasjon i EKG, tidskritisk reperfusjon (PCI innen 120 min), ASA og heparin.'
  );
  const [selectedDeckId, setSelectedDeckId] = useState(currentDeckId || decks[0]?.id || 'default');
  const [proposals, setProposals] = useState<CardVariationProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1, 2]);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Generate the 3 variations
  const handleGenerate = async (topicToUse = topic, contextToUse = contextText) => {
    if (!topicToUse.trim()) return;
    setIsLoading(true);
    setFlippedCards({});

    try {
      const generated = await fetchOrGenerate3Proposals(topicToUse, contextToUse, isOfflineOnly);
      setProposals(generated);
      setSelectedIndices([0, 1, 2]);
    } catch (e) {
      console.error('Error generating 3 proposals:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert proposal to Flashcard
  const proposalToFlashcard = (p: CardVariationProposal, index: number): Flashcard => {
    const deck = decks.find((d) => d.id === selectedDeckId) || decks[0];
    return {
      id: `FF-${Date.now().toString().slice(-4)}-${index + 1}`,
      deckId: selectedDeckId,
      kategori: deck?.kategori || 'Medisin/Fag',
      emne: topic,
      korttype: p.korttype,
      niva: p.niva,
      forside: p.forside,
      bakside: p.bakside,
      referansehenvisning: p.referansehenvisning,
      fullReferanse: p.fullReferanse,
      kildedokument: deck?.sourceFileName || 'Kildekompendium',
      kildeseksjon: `Seksjon ${p.variantType}`,
      design: p.design,
      bildestatus: p.svgContent ? 'lokal_svg' : 'ingen',
      bildeData: p.svgContent
        ? {
            position: 'side',
            svgContent: p.svgContent,
            isIllustrationNotice: true,
          }
        : undefined,
      status: 'KLAR',
      referanseKobling: 'DIREKTE',
      tagger: p.tagger || [topic],
      
      // Aliases
      question: p.forside,
      answer: p.bakside,
      reference: p.referansehenvisning,
      tags: p.tagger || [topic],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      srs: {
        box: 1,
        repetitionCount: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        dueDate: Date.now(),
        history: [],
      },
    };
  };

  const handleAddSingle = (p: CardVariationProposal, idx: number) => {
    const card = proposalToFlashcard(p, idx);
    onAddCard(card);
    // Remove from proposals
    setProposals((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddAll = () => {
    const cardsToAdd = proposals.map((p, idx) => proposalToFlashcard(p, idx));
    onAddAllCards(cardsToAdd);
    onClose();
  };

  // Quick preset pills
  const quickPresets = [
    { title: 'Hjerteinfarkt (STEMI)', context: 'Akutt koronarsyndrom, EKG ST-elevasjon, PCI, Troponin-T' },
    { title: 'Newtons lover & Dynamikk', context: 'Klassisk mekanikk, F=ma, treghetsloven, virkning og motvirkning' },
    { title: 'Avtalerett § 36', context: 'Urimelig avtale, bristende forutsetninger, forbrukervern' },
    { title: 'Binary Search Algoritme', context: 'Tidskompleksitet O(log n), sortert array, splitt og hersk' },
    { title: 'Celledeling: Mitose & Meiose', context: 'Profase, metafase, anafase, telofase, kromosompar' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                FlashForge: 3 Ulike Kortforslag
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Genererer alltid 3 pedagogisk distinkte kortperspektiver: 1) Kjernedefinisjon, 2) Klinisk/Praktisk case, 3) Dyp mekanisme & analyse.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Input Bar & Controls */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Emne eller fagbegrep
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="F.eks. Sepsis, Kvantemekanikk, Kontraktsrett..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Destinasjonskortsett
              </label>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">
              Kildetekst / Kontekst (valgfritt pensumutdrag)
            </label>
            <textarea
              rows={2}
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder="Lim inn utdrag fra pensum, tabell, retningslinje eller lærebok..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
            <span className="text-slate-500 font-semibold flex-shrink-0">Eksempler:</span>
            {quickPresets.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTopic(qp.title);
                  setContextText(qp.context);
                  handleGenerate(qp.title, qp.context);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex-shrink-0 border border-slate-700/60"
              >
                {qp.title}
              </button>
            ))}
          </div>

          {/* Actions & Token optimization note */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong>Token/Credit-optimalisert:</strong> Rask produksjon med 0 unødig tokenbruk &bull; Offline-klar.
              </span>
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={isLoading || !topic.trim()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{proposals.length > 0 ? 'Generer 3 nye ulike forslag' : 'Generer 3 forslag nå'}</span>
            </button>
          </div>
        </div>

        {/* 3 Proposals Display Grid */}
        {proposals.length > 0 && (
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Her er dine 3 unike forslag (Klikk kort for å snu):
              </h3>

              <button
                onClick={handleAddAll}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Legg til alle 3 kortene i kortsettet
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {proposals.map((p, idx) => {
                const cardInstance = proposalToFlashcard(p, idx);
                const isFlipped = !!flippedCards[idx];

                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-4 hover:border-slate-700 transition-all shadow-xl"
                  >
                    {/* Perspective Header */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                          {p.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {p.design}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        {p.begrunnelse}
                      </p>
                    </div>

                    {/* Interactive Flashcard Visual */}
                    <div className="flex-1">
                      <CardVisual
                        card={cardInstance}
                        isFlipped={isFlipped}
                        onFlip={() =>
                          setFlippedCards((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        interactive={true}
                        showDesignBadge={true}
                      />
                    </div>

                    {/* Single Add Button */}
                    <button
                      type="button"
                      onClick={() => handleAddSingle(p, idx)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700 hover:border-indigo-500"
                    >
                      <Plus className="w-4 h-4" />
                      Velg dette kortet ({p.korttype})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
