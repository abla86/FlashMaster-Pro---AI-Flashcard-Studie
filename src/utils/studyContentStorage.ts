// Storage for non-flashcard study content (worksheets, checklists, study reading, cases)
// and automated Study Plan

import { StudyContentItem, StudyPlan, StudyPlanGoal, Flashcard } from '../types/flashcard';

const STORAGE_KEYS = {
  STUDY_CONTENT: 'flashforge_study_content_v1',
  STUDY_PLAN: 'flashforge_study_plan_v1',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading ${key}:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

export function loadStudyContent(): StudyContentItem[] {
  return getStored<StudyContentItem[]>(STORAGE_KEYS.STUDY_CONTENT, [
    {
      id: 'sc-pico-matrix',
      type: 'forskningsmetode',
      title: 'PICO Forskningsmatrise & Kunnskapsbasert Praksis',
      content:
        'P = Pasient/populasjon (f.eks. voksne med akutt hjerteinfarkt)\nI = Intervensjon (f.eks. tidlig PCI vs. trombolyse)\nC = Comparison/kontrollgruppe (f.eks. standard medisinsk behandling)\nO = Outcome/utfallsmål (f.eks. 30-dagers mortalitet og re-infarktrate).\n\nBruk: Formulering av presise faglige spørsmål før litteratursøk i PubMed, Cinahl og Cochrane Library.',
      sourceFile: 'FLASHFORGE_READY_MASTERBANK.xlsx',
      sourceSection: 'Forskningsmetode & PICO',
      category: 'Forskningsmetode',
      tags: ['PICO', 'Kunnskapsbasert praksis', 'Litteraturmatrise'],
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'sc-abcde-checklist',
      type: 'sjekkliste',
      title: 'ABCDE Akuttmedisinsk Primærundersøkelse Sjekkliste',
      content:
        'A - Airway: Frie luftveier, fremmedlegemer, stridor, nakkestabilisering ved traume.\nB - Breathing: Respirasjonsfrekvens (12-20), SpO2, symmetrisk brystbevegelse, auskultasjon.\nC - Circulation: Puls (60-100), blodtrykk, kapillærfylning (<2s), hud (varm/kald, klam).\nD - Disability: GCS / AVPU, pupiller (størrelse/lysreaksjon), blodsukker (utelukk hypoglykemi!).\nE - Exposure: Helkroppsundersøkelse, temperatur, utslett (petekkier), forebygg hypotermi.',
      sourceFile: 'FLASHFORGE_READY_MASTERBANK.xlsx',
      sourceSection: 'Akuttmedisin & Triage',
      category: 'Akuttmedisin',
      tags: ['ABCDE', 'Sjekkliste', 'Triage', 'Akutt'],
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'sc-legemiddel-worksheet',
      type: 'arbeidsark',
      title: 'Legemiddelregning: Kjerneformler & Dobbelkontroll',
      content:
        '1. Dose = Styrke × Volum\n2. Volum = Dose / Styrke\n3. Styrke = Dose / Volum\n4. Infusjonshastighet (dråper/min) = (Volum i ml × 20 dråper/ml) / Tid i minutter\n5. Infusjonshastighet (ml/time) = Volum i ml / Tid i timer\n\nGylden regel: Kontroller alltid benevninger (mg, mcg, g) før utregning. 1 mg = 1000 mcg.',
      sourceFile: 'FLASHFORGE_READY_MASTERBANK.xlsx',
      sourceSection: 'Farmakologi & Legemiddelregning',
      category: 'Farmakologi',
      tags: ['Legemiddelregning', 'Formler', 'Arbeidsark'],
      createdAt: Date.now() - 86400000 * 3,
    },
  ]);
}

export function saveStudyContent(items: StudyContentItem[]): void {
  setStored(STORAGE_KEYS.STUDY_CONTENT, items);
}

export function appendStudyContent(newItems: StudyContentItem[]): void {
  const existing = loadStudyContent();
  const existingIds = new Set(existing.map((e) => e.id));
  const filtered = newItems.filter((n) => !existingIds.has(n.id));
  saveStudyContent([...filtered, ...existing]);
}

// Generate automated Study Plan based on loaded cards
export function generateAutomatedStudyPlan(cards: Flashcard[], deckId: string = 'all'): StudyPlan {
  const targetCards = deckId === 'all' ? cards : cards.filter((c) => c.deckId === deckId);
  const total = targetCards.length;

  const categories = Array.from(new Set(targetCards.map((c) => c.kategori).filter(Boolean)));
  const goals: StudyPlanGoal[] = [];

  // Daily goal: 30 cards or proportional
  const dailyTarget = Math.min(Math.max(20, Math.round(total / 30)), 60);
  goals.push({
    id: 'goal-daily',
    title: 'Dagens repetisjonsmål',
    category: 'Alle fagområder',
    targetCards: dailyTarget,
    completedCards: Math.min(12, dailyTarget),
    dueDay: new Date().toISOString().split('T')[0],
    isCompleted: false,
    type: 'daily',
  });

  // Weekly goal
  goals.push({
    id: 'goal-weekly',
    title: 'Ukentlig gjennomgang',
    category: 'Masterplan',
    targetCards: dailyTarget * 5,
    completedCards: Math.min(45, dailyTarget * 5),
    dueDay: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    isCompleted: false,
    type: 'weekly',
  });

  // Category specific goals
  categories.slice(0, 4).forEach((cat, idx) => {
    const catCards = targetCards.filter((c) => c.kategori === cat);
    goals.push({
      id: `goal-cat-${idx}`,
      title: `Fokus: ${cat}`,
      category: cat,
      targetCards: catCards.length,
      completedCards: catCards.filter((c) => (c.srs?.box || 1) >= 2).length,
      dueDay: new Date(Date.now() + 86400000 * (idx + 2)).toISOString().split('T')[0],
      isCompleted: false,
      type: 'weak_topics',
    });
  });

  return {
    deckId,
    dailyGoalCards: dailyTarget,
    weeklyGoalCards: dailyTarget * 5,
    examDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    goals,
    weakTopicsFocus: ['Akuttmedisin', 'Farmakologi & Legemiddelregning', 'Kardiologi'],
    lastUpdated: Date.now(),
  };
}

export function loadStudyPlan(cards: Flashcard[], deckId: string = 'all'): StudyPlan {
  const stored = getStored<StudyPlan | null>(STORAGE_KEYS.STUDY_PLAN, null);
  if (!stored) {
    const generated = generateAutomatedStudyPlan(cards, deckId);
    setStored(STORAGE_KEYS.STUDY_PLAN, generated);
    return generated;
  }
  return stored;
}

export function saveStudyPlan(plan: StudyPlan): void {
  setStored(STORAGE_KEYS.STUDY_PLAN, plan);
}
