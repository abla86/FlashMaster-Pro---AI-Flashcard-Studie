import React, { useState } from 'react';
import { Flashcard, CardDesignFamily, CardDesignTheme, Deck } from '../types/flashcard';
import { CardVisual } from './CardVisual';
import {
  Sparkles,
  Save,
  Trash2,
  Image as ImageIcon,
  Palette,
  BookOpen,
  Loader2,
  Check,
} from 'lucide-react';

interface CardEditorModalProps {
  card?: Flashcard | null;
  deckId: string;
  decks: Deck[];
  onSave: (savedCard: Flashcard) => void;
  onDelete?: (cardId: string) => void;
  onClose: () => void;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  card,
  deckId,
  decks,
  onSave,
  onDelete,
  onClose,
}) => {
  const isEditing = !!card;

  const [question, setQuestion] = useState(card?.question || '');
  const [answer, setAnswer] = useState(card?.answer || '');
  const [reference, setReference] = useState(card?.reference || '');
  const [frontExtra, setFrontExtra] = useState(card?.frontExtra || '');
  const [backExtra, setBackExtra] = useState(card?.backExtra || '');
  const [tagsStr, setTagsStr] = useState((card?.tags || []).join(', '));
  const [selectedDeckId, setSelectedDeckId] = useState(card?.deckId || deckId);
  const [design, setDesign] = useState<CardDesignFamily>(card?.design || 'Nordic');

  const [fullReference, setFullReference] = useState(card?.fullReferanse || '');
  const [kategori, setKategori] = useState(card?.kategori || 'Fag');
  const [emne, setEmne] = useState(card?.emne || 'Generelt');
  const [korttype, setKorttype] = useState(card?.korttype || 'Definisjon');
  const [niva, setNiva] = useState(card?.niva || 'Grunnleggende');

  // Image & SVG state
  const [imageSvg, setImageSvg] = useState(card?.bildeData?.svgContent || card?.image?.svgContent || '');
  const [imageUrl, setImageUrl] = useState(card?.bildeData?.url || card?.image?.url || '');
  const [imagePos, setImagePos] = useState<'top' | 'side' | 'back'>(card?.bildeData?.position || card?.image?.position || 'side');

  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate SVG schematic with AI
  const handleGenerateIllustration = async () => {
    if (!question.trim()) {
      setErrorMsg('Vennligst fyll ut spørsmålet først før du genererer en illustrasjon.');
      return;
    }

    setIsGeneratingIllustration(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer: answer || question,
          topic: tagsStr.split(',')[0] || emne || 'Læring',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.svg) {
          setImageSvg(data.svg);
        } else {
          throw new Error('Mottok ingen SVG fra serveren.');
        }
      } else {
        generateFallbackSvg();
      }
    } catch (e: any) {
      console.warn('SVG generation fallback:', e);
      generateFallbackSvg();
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  const generateFallbackSvg = () => {
    const fallback = `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="35" fill="#312e81" stroke="#6366f1" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M50 25 L50 75 M25 50 L75 50" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="10" fill="#38bdf8"/>
    </svg>`;
    setImageSvg(fallback);
  };

  // Preview card instance
  const previewCard: Flashcard = {
    id: card?.id || `FF-${Date.now().toString().slice(-4)}`,
    deckId: selectedDeckId,
    kategori,
    emne,
    korttype: korttype as any,
    niva: niva as any,
    forside: question || 'Eksempel: Hva er definisjonen?',
    bakside: answer || 'Eksempel: Svaret og den pedagogiske forklaringen vises her på baksiden.',
    referansehenvisning: reference || 'Kildehenvisning / Pensum',
    fullReferanse: fullReference,
    kildedokument: card?.kildedokument || 'Manuell oppføring',
    kildeseksjon: card?.kildeseksjon || 'Avsnitt 1',
    design: (design as any) || 'Clinical',
    bildestatus: imageSvg ? 'lokal_svg' : imageUrl ? 'kildebilde' : 'ingen',
    bildeData: imageSvg
      ? { svgContent: imageSvg, position: imagePos, isIllustrationNotice: true }
      : imageUrl
      ? { url: imageUrl, position: imagePos }
      : undefined,
    status: 'KLAR',
    referanseKobling: 'DIREKTE',
    tagger: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
    
    // Aliases
    question: question || 'Eksempel: Hva er definisjonen?',
    answer: answer || 'Eksempel: Svaret og den pedagogiske forklaringen vises her på baksiden.',
    reference: reference || 'Kildehenvisning / Pensum',
    frontExtra,
    backExtra,
    tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
    image: imageSvg
      ? { svgContent: imageSvg, position: imagePos }
      : imageUrl
      ? { url: imageUrl, position: imagePos }
      : undefined,
    createdAt: card?.createdAt || Date.now(),
    updatedAt: Date.now(),
    srs: card?.srs || {
      box: 1,
      repetitionCount: 0,
      easeFactor: 2.5,
      intervalDays: 1,
      dueDate: Date.now(),
      history: [],
    },
  };

  const handleSave = () => {
    if (!question.trim()) {
      setErrorMsg('Spørsmål kan ikke være tomt.');
      return;
    }
    if (!answer.trim()) {
      setErrorMsg('Svar kan ikke være tomt.');
      return;
    }
    if (!reference.trim()) {
      setErrorMsg('Referanse er påkrevd (min. 1 spørsmål - 1 svar - 1 referanse).');
      return;
    }

    const savedCard: Flashcard = {
      ...previewCard,
      id: card?.id || `card-${Date.now()}`,
    };

    onSave(savedCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Palette className="w-6 h-6 text-indigo-400" />
              {isEditing ? 'Rediger Flashcard' : 'Opprett Nytt Flashcard'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Minimum: 1 spørsmål, 1 svar, 1 referanse &bull; Velg eget design og legg til bilde/illustrasjon
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form and Live Preview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Form Fields */}
          <div className="space-y-4">
            {/* Kortsett velger */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Kortsett</label>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Design theme selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Kortdesign (Velg tema)</span>
                <span className="text-[11px] text-indigo-400 font-mono">6 unike stiler</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Nordic', name: 'Nordisk', color: 'border-sky-500/50 bg-slate-800/80 text-sky-300' },
                  { id: 'Clinical', name: 'Clinical', color: 'border-teal-500/50 bg-teal-950/40 text-teal-300' },
                  { id: 'Academic', name: 'Akademisk', color: 'border-[#d4af37]/50 bg-[#221a14] text-[#d4af37]' },
                  { id: 'Process', name: 'Process', color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300' },
                  { id: 'Formula', name: 'Formula', color: 'border-sky-600/50 bg-[#08182b] text-sky-200' },
                  { id: 'Minimal', name: 'Minimal', color: 'border-neutral-500/50 bg-neutral-900 text-white' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setDesign(th.id as CardDesignFamily)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all text-center ${th.color} ${
                      design === th.id ? 'ring-2 ring-indigo-400 font-bold scale-[1.02]' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {th.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Spørsmål (MANDATORY) */}
            <div>
              <label className="text-xs font-semibold text-sky-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>1. Spørsmål / Begrep (Obligatorisk)</span>
                <span className="text-[10px] text-slate-400 lowercase">forside</span>
              </label>
              <textarea
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="F.eks: Hva er Newtons 3. lov?"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Hint / Forside tillegg */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Hint / Kontekst (valgfritt)
              </label>
              <input
                type="text"
                value={frontExtra}
                onChange={(e) => setFrontExtra(e.target.value)}
                placeholder="F.eks: Kraft og motkraft"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 2. Svar (MANDATORY) */}
            <div>
              <label className="text-xs font-semibold text-emerald-400 block mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>2. Svar / Forklaring (Obligatorisk)</span>
                <span className="text-[10px] text-slate-400 lowercase">bakside</span>
              </label>
              <textarea
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="F.eks: For enhver kraft er det alltid en like stor og motsatt rettet motkraft."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Utdyping / Bakside tillegg */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Utdyping / Eksempel (valgfritt)
              </label>
              <textarea
                rows={2}
                value={backExtra}
                onChange={(e) => setBackExtra(e.target.value)}
                placeholder="Ekstra detaljer eller eksempler på baksiden..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 3. Referanse (MANDATORY) */}
            <div>
              <label className="text-xs font-semibold text-amber-400 block mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>3. Kilde / Referanse (Obligatorisk)</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="F.eks: Fysikk 1, Cappelen Damm, kapittel 3.2, s. 88"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Tags & Bilde seksjon */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Emneknagger (kommaseparert)</label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="Fysikk, Mekanikk"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Bildeplassering</label>
                <select
                  value={imagePos}
                  onChange={(e) => setImagePos(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="side">Side / Ved siden av</option>
                  <option value="top">Topp / Banner</option>
                  <option value="back">Kun på bakside</option>
                </select>
              </div>
            </div>

            {/* Illustrasjon & Bildeverktøy */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  Illustrasjon & Bilde
                </span>

                <button
                  type="button"
                  onClick={handleGenerateIllustration}
                  disabled={isGeneratingIllustration}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isGeneratingIllustration ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>Generer AI-illustrasjon</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (e.target.value) setImageSvg('');
                  }}
                  placeholder="Eller lim inn bilde-URL (https://...)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs"
                />

                {(imageSvg || imageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageSvg('');
                      setImageUrl('');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                  >
                    Fjern
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Card Preview */}
          <div className="space-y-4 sticky top-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Sanntids forhåndsvisning:</span>
              <button
                type="button"
                onClick={() => setPreviewFlipped(!previewFlipped)}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                {previewFlipped ? 'Vis forside' : 'Vis bakside'}
              </button>
            </div>

            <div className="min-h-[380px] flex items-center justify-center">
              <CardVisual
                card={previewCard}
                isFlipped={previewFlipped}
                onFlip={() => setPreviewFlipped(!previewFlipped)}
                interactive={true}
              />
            </div>

            <p className="text-center text-xs text-slate-500 italic">
              Klikk på kortet over for å se hvordan det snur seg
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Er du sikker på at du vil slette dette flashcardet?')) {
                  onDelete(card.id);
                  onClose();
                }
              }}
              className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Slett kort
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-colors"
            >
              Avbryt
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Lagre kort
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
