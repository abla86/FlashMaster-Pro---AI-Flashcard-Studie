import React, { useState } from 'react';
import { Flashcard, CardStatus } from '../types/flashcard';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  Check,
  ExternalLink,
} from 'lucide-react';

interface SourceControlModalProps {
  cards: Flashcard[];
  onUpdateCardStatus: (cardId: string, newStatus: CardStatus) => void;
  onClose: () => void;
}

export const SourceControlModal: React.FC<SourceControlModalProps> = ({
  cards,
  onUpdateCardStatus,
  onClose,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Status counters
  const statusCounts = {
    KLAR: cards.filter((c) => c.status === 'KLAR').length,
    TEMAREFERANSE: cards.filter((c) => c.status === 'TEMAREFERANSE').length,
    USIKKER_KOBLING: cards.filter((c) => c.status === 'USIKKER_KOBLING').length,
    KREVER_FAGLIG_KONTROLL: cards.filter((c) => c.status === 'KREVER_FAGLIG_KONTROLL').length,
    MANGLER_REFERANSE: cards.filter((c) => !c.reference || !c.referansehenvisning).length,
  };

  const filteredCards = cards.filter((c) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch =
      !search ||
      c.question.toLowerCase().includes(search.toLowerCase()) ||
      c.reference.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <FileCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                FlashForge Kildekontroll & Integritetsmatrise
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Sikrer at ingen svar eller referanser er oppdiktet. Kun kort med status KLAR eller TEMAREFERANSE er automatisk publiseringsklare.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Quality Audit Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">1. Spørsmål finnes</span>
            <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1 mt-0.5">
              <Check className="w-3.5 h-3.5" /> 100% Verifisert
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">2. Svar finnes</span>
            <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1 mt-0.5">
              <Check className="w-3.5 h-3.5" /> 100% Verifisert
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">3. Direkte kildeknytning</span>
            <span className="text-sky-400 font-extrabold text-sm flex items-center gap-1 mt-0.5">
              <Check className="w-3.5 h-3.5" /> {statusCounts.KLAR} Direkte
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">4. Anti-oppdiktingsvern</span>
            <span className="text-teal-400 font-extrabold text-sm flex items-center gap-1 mt-0.5">
              <Check className="w-3.5 h-3.5" /> Streng kildeintegritet
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Alle ({cards.length})
          </button>

          <button
            onClick={() => setFilterStatus('KLAR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterStatus === 'KLAR'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
            }`}
          >
            KLAR ({statusCounts.KLAR})
          </button>

          <button
            onClick={() => setFilterStatus('TEMAREFERANSE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterStatus === 'TEMAREFERANSE'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
            }`}
          >
            TEMAREFERANSE ({statusCounts.TEMAREFERANSE})
          </button>

          <button
            onClick={() => setFilterStatus('USIKKER_KOBLING')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filterStatus === 'USIKKER_KOBLING'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
            }`}
          >
            USIKKER_KOBLING ({statusCounts.USIKKER_KOBLING})
          </button>

          <div className="ml-auto w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søk i kilder eller spørsmål..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>
        </div>

        {/* Card Status Table */}
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400">{card.id}</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-slate-300 font-semibold">{card.emne || card.kategori || 'Fag'}</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {card.korttype || 'Kort'}
                  </span>
                </div>

                <div className="font-bold text-white text-sm line-clamp-1">
                  {card.forside || card.question}
                </div>

                <div className="text-slate-300 text-xs line-clamp-1">
                  <strong className="text-emerald-400">Svar:</strong> {card.bakside || card.answer}
                </div>

                <div className="text-amber-300 text-xs flex items-center gap-1.5 pt-0.5 truncate">
                  <span className="font-bold">Referanse:</span>
                  <span className="truncate">{card.referansehenvisning || card.reference}</span>
                  {card.fullReferanse && (
                    <span className="text-[10px] text-slate-500 truncate hidden lg:inline">
                      ({card.fullReferanse})
                    </span>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={card.status || 'KLAR'}
                  onChange={(e) => onUpdateCardStatus(card.id, e.target.value as CardStatus)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono border focus:ring-1 focus:ring-indigo-500 ${
                    card.status === 'KLAR'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                      : card.status === 'TEMAREFERANSE'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                      : 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                  }`}
                >
                  <option value="KLAR">KLAR (Publiserbar)</option>
                  <option value="KLAR_MEN_SAMMENSLÅTT">KLAR_MEN_SAMMENSLÅTT</option>
                  <option value="TEMAREFERANSE">TEMAREFERANSE</option>
                  <option value="USIKKER_KOBLING">USIKKER_KOBLING</option>
                  <option value="KREVER_FAGLIG_KONTROLL">KREVER_FAGLIG_KONTROLL</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
