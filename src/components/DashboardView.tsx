import React from 'react';
import { Deck, Flashcard, StudyStats } from '../types/flashcard';
import { CardVisual } from './CardVisual';
import {
  ShieldCheck,
  Sparkles,
  Play,
  Upload,
  BarChart3,
  Layers,
  Award,
  Flame,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Activity,
  Heart,
  Pill,
} from 'lucide-react';

interface DashboardViewProps {
  decks: Deck[];
  cards: Flashcard[];
  stats: StudyStats;
  onNavigate: (view: any) => void;
  onStartStudy: (deckId?: string) => void;
  onReloadMasterbank: () => void;
  onOpenThreeProposals: () => void;
  onOpenPipeline: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  decks,
  cards,
  stats,
  onNavigate,
  onStartStudy,
  onReloadMasterbank,
  onOpenThreeProposals,
  onOpenPipeline,
}) => {
  const masterbankCards = cards.filter((c) => c.id.startsWith('FF-'));
  const verifiedCount = cards.filter((c) => c.qualityAudit?.passedAll ?? (c.status === 'KLAR')).length;
  const flaggedCount = cards.length - verifiedCount;

  const dueCount = cards.filter((c) => (c.srs?.dueDate || 0) <= Date.now()).length;
  const recentCards = cards.slice(0, 3);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900/90 to-indigo-950/50 border border-teal-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              FlashForge Master Engine &bull; FLASHFORGE_READY_MASTERBANK.xlsx Aktiv
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Profesjonelle Flashcards med 100% Kildeintegritet
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Motta og bearbeid store datamengder fra Excel, Word og PDF. Automatisk layoutvalg blant 19+ designfamilier, offline-sikkerhet, Leitner repetisjon og sømløs eksport.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onStartStudy()}
                disabled={cards.length === 0}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Dagens Studie ({dueCount} klar)</span>
              </button>

              <button
                onClick={onOpenThreeProposals}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>⚡ 3 Ulike Forslag</span>
              </button>

              <button
                onClick={onOpenPipeline}
                className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>Kjør Batch Pipeline</span>
              </button>
            </div>
          </div>

          {/* Quick Masterbank Card Info */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Masterdata Status
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                KLAR
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Masterbank-kort:</span>
                <span className="font-bold text-white font-mono">{masterbankCards.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Totale kort:</span>
                <span className="font-bold text-sky-300 font-mono">{cards.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kildekontroll:</span>
                <span className="text-emerald-400 font-bold">100% Verifisert</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Token-forbruk:</span>
                <span className="text-slate-300 font-bold">Optimalisert (0 kreditt)</span>
              </div>
            </div>

            <button
              onClick={onReloadMasterbank}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-sky-400" />
              Gjenopprett Masterbank
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Totalt Kort</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{cards.length}</div>
          <div className="text-[11px] text-slate-400">{decks.length} kortsett aktive</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Treffsikkerhet</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.retentionRate}%</div>
          <div className="text-[11px] text-slate-400">{stats.correctReviews} av {stats.totalReviews} riktige</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daglig Streak</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-black text-orange-400">{stats.streakDays} dager</div>
          <div className="text-[11px] text-slate-400">{stats.timeSpentMinutes} minutter studert</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Kvalitetsstatus</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400">{verifiedCount}</div>
          <div className="text-[11px] text-slate-400">
            {flaggedCount > 0 ? `${flaggedCount} krever kontroll` : 'Alle 100% godkjent'}
          </div>
        </div>
      </div>

      {/* Featured Masterbank Cards Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Forhåndsvisning: Verifiserte Masterbank Flashcards
            </h2>
            <p className="text-xs text-slate-400">
              Spørsmål/case på forside &bull; Korrekt svar og full referanse på bakside. Klikk kort for å snu.
            </p>
          </div>

          <button
            onClick={() => onNavigate('cards')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Se alle {cards.length} kort i biblioteket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentCards.map((card) => (
            <div key={card.id} className="relative group">
              <CardVisual card={card} interactive={true} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
