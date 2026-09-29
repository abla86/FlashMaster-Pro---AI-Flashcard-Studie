import React, { useState } from 'react';
import { Flashcard, Deck, StudyPlan } from '../types/flashcard';
import { loadStudyPlan, saveStudyPlan } from '../utils/studyContentStorage';
import {
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Award,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Play,
  Stethoscope,
  Zap,
} from 'lucide-react';

interface StudyPlanViewProps {
  cards: Flashcard[];
  decks: Deck[];
  onStartStudy: (deckId: string, filterMode?: string) => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  cards,
  decks,
  onStartStudy,
}) => {
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(() => loadStudyPlan(cards));

  const toggleGoal = (goalId: string) => {
    const updatedGoals = studyPlan.goals.map((g) =>
      g.id === goalId ? { ...g, isCompleted: !g.isCompleted } : g
    );
    const updatedPlan = { ...studyPlan, goals: updatedGoals, lastUpdated: Date.now() };
    setStudyPlan(updatedPlan);
    saveStudyPlan(updatedPlan);
  };

  const totalCardsCount = cards.length;
  const masteredCards = cards.filter((c) => (c.srs?.box || 1) >= 4).length;
  const weakCards = cards.filter((c) => (c.srs?.box || 1) <= 2).length;
  const caseCards = cards.filter((c) => c.korttype === 'Case' || c.design === 'Case').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-sky-950/40 border border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Target className="w-3.5 h-3.5" />
            <span>Automatisert Studieplan & Målstyring</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Din Tilpassede Studieplan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Bygget automatisk basert på hele masterbanken og dine importerte dokumenter. Systemet planlegger daglige og ukentlige mål, eksamensrepetisjon og målrettet innsats mot svakere tema.
          </p>
        </div>

        {/* Quick Launch Button */}
        <button
          onClick={() => onStartStudy('all')}
          className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 self-start md:self-center"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start Dagens Økt</span>
        </button>
      </div>

      {/* 4 Quick Training Modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Review */}
        <div
          onClick={() => onStartStudy('all')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {studyPlan.dailyGoalCards} kort
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Dagens Mål</h4>
            <p className="text-xs text-slate-400 mt-0.5">Daglige repetisjoner etter Leitner-systemet.</p>
          </div>
        </div>

        {/* 2. Weak Topics */}
        <div
          onClick={() => onStartStudy('all', 'weak')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/60 cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-300">{weakCards} kort</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Svake Tema</h4>
            <p className="text-xs text-slate-400 mt-0.5">Kort i boks 1-2 som trenger oppfriskning.</p>
          </div>
        </div>

        {/* 3. Case Training */}
        <div
          onClick={() => onStartStudy('all', 'cases')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/60 cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-rose-300">{caseCards} case</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Case-Trening</h4>
            <p className="text-xs text-slate-400 mt-0.5">Kliniske scenarier og "Hva gjør du først?".</p>
          </div>
        </div>

        {/* 4. Quick Recall */}
        <div
          onClick={() => onStartStudy('all')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/60 cursor-pointer transition-all space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-sky-300">Hurtig</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Hurtigrepetisjon</h4>
            <p className="text-xs text-slate-400 mt-0.5">Rask gjenkalling av nøkkelbegreper.</p>
          </div>
        </div>
      </div>

      {/* Plan Goals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
          <span>Studiemål & Framdrift</span>
          <span>{studyPlan.goals.filter((g) => g.isCompleted).length} av {studyPlan.goals.length} fullført</span>
        </div>

        <div className="space-y-2.5">
          {studyPlan.goals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                goal.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-300'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                    goal.isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                >
                  {goal.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="space-y-0.5">
                  <h4 className={`text-sm font-bold ${goal.isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                    {goal.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="text-sky-400">{goal.category}</span>
                    <span>&bull;</span>
                    <span>{goal.completedCards} av {goal.targetCards} kort</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  Frist: {goal.dueDay}
                </span>
                <span className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                  <span>Øv</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
