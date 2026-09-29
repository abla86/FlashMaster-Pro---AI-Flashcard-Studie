import React, { useState } from 'react';
import { Flashcard } from '../types/flashcard';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface DocumentViewerModalProps {
  cards: Flashcard[];
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  cards,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'KLAR' | 'USIKKER_KOBLING' | 'KREVER_KONTROLL'>('all');

  const filteredCards = cards.filter((c) => {
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'KLAR'
        ? c.status === 'KLAR'
        : c.status === statusFilter || c.referanseKobling === statusFilter;
    const matchSearch =
      !searchQuery.trim() ||
      c.forside.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bakside.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.kildedokument || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.referansehenvisning || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-sky-400" />
              Dokumenter & Full Kildeintegritet
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Spor ethvert flashcard tilbake til nøyaktig kildedokument, seksjon, sidetall og APA 7 referanse.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter kildedokument, tema, spørsmål eller referanse..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Alle ({cards.length})
            </button>
            <button
              onClick={() => setStatusFilter('KLAR')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === 'KLAR'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Godkjent kildeliste
            </button>
            <button
              onClick={() => setStatusFilter('USIKKER_KOBLING')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === 'USIKKER_KOBLING'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Usikker kobling
            </button>
          </div>
        </div>

        {/* Document Cards Table */}
        <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
          {filteredCards.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              Ingen dokumentelementer matcher søket.
            </div>
          ) : (
            filteredCards.map((card) => (
              <div
                key={card.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sky-400 font-bold text-[11px] bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
                      {card.id}
                    </span>
                    <span className="font-semibold text-slate-200">{card.kategori} &bull; {card.emne}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-400">Kilde:</span>
                    <strong className="text-emerald-400">{card.kildedokument || 'FLASHFORGE_READY_MASTERBANK.xlsx'}</strong>
                    {card.kildeseksjon && (
                      <span className="text-slate-500 font-mono">({card.kildeseksjon})</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      FORSIDE (Spørsmål/Case)
                    </span>
                    <p className="text-white font-medium">{card.forside || card.question}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      BAKSIDE (Svar & Referanse)
                    </span>
                    <p className="text-slate-200 line-clamp-3 leading-relaxed">{card.bakside || card.answer}</p>
                    <div className="text-[10px] text-sky-300 pt-1 border-t border-white/5">
                      <strong>APA 7:</strong> {card.referansehenvisning}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
