import React from 'react';
import { StudyStats, Flashcard, Deck } from '../types/flashcard';
import {
  BarChart3,
  TrendingUp,
  Flame,
  Clock,
  Award,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Percent,
} from 'lucide-react';

interface StatisticsModalProps {
  stats: StudyStats;
  cards: Flashcard[];
  decks: Deck[];
  onClose: () => void;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  stats,
  cards,
  decks,
  onClose,
}) => {
  // Leitner box distribution
  const boxCounts = [0, 0, 0, 0, 0];
  cards.forEach((c) => {
    const box = Math.max(1, Math.min(5, c.srs?.box || 1));
    boxCounts[box - 1]++;
  });

  const totalCards = cards.length;
  const masteredCount = boxCounts[3] + boxCounts[4]; // Box 4 and 5
  const masteredPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  const correctReviews = stats.correctReviews || Math.round((stats.totalReviews * stats.retentionRate) / 100);
  const wrongReviews = stats.wrongReviews || (stats.totalReviews - correctReviews);
  const accuracyPercent = stats.totalReviews > 0 ? Math.round((correctReviews / stats.totalReviews) * 100) : 0;

  // Recent 7 days activity
  const last7Days: { dateStr: string; label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('no-NO', { weekday: 'short' });
    const count = stats.dailyReviews[dateStr] || 0;
    last7Days.push({ dateStr, label: dayName, count });
  }

  const maxDaily = Math.max(1, ...last7Days.map((d) => d.count));

  // Category results
  const categoryStats = stats.categoryStats || {};
  const categoryEntries = Object.entries(categoryStats);

  // Weak topics
  const weakTopics = stats.weakTopics || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              FlashForge Læringsstatistikk & Fremgang
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Spacert repetisjon, treffsikkerhet, kategorieresultat og svake tema &bull; 100% lokalt og privat
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Top KPI Cards (8 requirement fields) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Studerte kort */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Studerte kort</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalCards}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{decks.length} kortsett aktive</div>
          </div>

          {/* 2. Riktige vs Feil */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Riktige / Feil</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
              <span className="text-emerald-400">{correctReviews}</span>
              <span className="text-slate-600 text-lg">/</span>
              <span className="text-rose-400 text-lg">{wrongReviews}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stats.totalReviews} repetisjoner</div>
          </div>

          {/* 3. Treffprosent */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Treffsikkerhet</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className={`text-2xl font-black ${accuracyPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {accuracyPercent}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Mestret: {masteredPercent}%</div>
          </div>

          {/* 4. Streak og Tid */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Streak & Tid</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-orange-400 flex items-center gap-1">
              {stats.streakDays} <span className="text-xs text-slate-400 font-normal">dager</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stats.timeSpentMinutes} minutter totalt</div>
          </div>
        </div>

        {/* Section 1: Leitner 5-Boks Repetisjonsfordeling */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-sky-400" />
              Repetisjonsfordeling (Leitner 5-Boks System)
            </h3>
            <span className="text-xs text-slate-400">
              Kort flyttes til høyere bokser ved gode svar
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Boks 1', desc: 'Ny / Repeter daglig', color: 'from-rose-500 to-rose-600', count: boxCounts[0] },
              { label: 'Boks 2', desc: 'Hver 3. dag', color: 'from-amber-500 to-amber-600', count: boxCounts[1] },
              { label: 'Boks 3', desc: 'Ukentlig', color: 'from-yellow-500 to-yellow-600', count: boxCounts[2] },
              { label: 'Boks 4', desc: 'Hver 2. uke', color: 'from-sky-500 to-sky-600', count: boxCounts[3] },
              { label: 'Boks 5', desc: 'Månedlig (Mestret)', color: 'from-emerald-500 to-emerald-600', count: boxCounts[4] },
            ].map((box, i) => {
              const pct = totalCards > 0 ? Math.round((box.count / totalCards) * 100) : 0;
              return (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 block">{box.label}</span>
                  <div className="text-xl font-extrabold text-white">{box.count}</div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${box.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">{box.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Progresjon over 7 dager & Kategorieresultat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Activity Chart */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Progresjon Siste 7 Dager
            </h3>

            <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
              {last7Days.map((d) => {
                const heightPct = Math.round((d.count / maxDaily) * 100);
                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] text-slate-400 font-mono">{d.count}</span>
                    <div className="w-full max-w-[32px] bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-24">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-sky-400 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kategorieresultat */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Kategorieresultat & Mestring
            </h3>

            {categoryEntries.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                Ingen kategoridata enda. Fullfør en studieøkt for å se mestring per emne.
              </p>
            ) : (
              <div className="space-y-3">
                {categoryEntries.map(([cat, cstat]) => {
                  const pct = cstat.total > 0 ? Math.round((cstat.correct / cstat.total) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{cat}</span>
                        <span className="text-slate-400 font-mono">
                          {cstat.correct}/{cstat.total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Svake Temaer (Trenger mer repetisjon) */}
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Svake Temaer (Anbefalt Repetisjon)
            </h3>
            <span className="text-xs text-slate-400">
              Registrert automatisk ved feil i studiemodus
            </span>
          </div>

          {weakTopics.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Flott innsats! Ingen svake temaer registrert med feilsvar akkurat nå.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {weakTopics.slice(0, 6).map((wt, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block truncate">{wt.topic}</span>
                    <span className="text-[10px] text-slate-400">{wt.category}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] font-bold flex-shrink-0">
                    {wt.wrongCount} feil
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
