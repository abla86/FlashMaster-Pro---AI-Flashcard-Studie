import { Deck, Flashcard, StudyStats, StudySessionResult } from '../types/flashcard';
import { MASTERBANK_DECK, MASTERBANK_CARDS } from './masterbankData';
import { INITIAL_DECKS, INITIAL_CARDS } from './sampleData';
import {
  idbSaveCards,
  idbLoadCards,
  idbSaveDecks,
  idbLoadDecks,
  idbSaveStats,
  idbLoadStats,
} from './indexedDb';

const STORAGE_KEYS = {
  DECKS: 'flashforge_decks_master_v2',
  CARDS: 'flashforge_cards_master_v2',
  STATS: 'flashforge_stats_master_v2',
  OFFLINE_ONLY: 'flashforge_offline_shield_v2',
  DARK_MODE: 'flashforge_dark_mode_v2',
  AUTOSAVE: 'flashforge_autosave_interval_v2',
};

// In-memory cache to guarantee synchronous read performance
let memoryCards: Flashcard[] | null = null;
let memoryDecks: Deck[] | null = null;
let memoryStats: StudyStats | null = null;

// Safe local storage helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // QuotaExceededError is safely caught and ignored because IndexedDB stores the full data
    console.warn(`localStorage quota exceeded for ${key} - data sikret i IndexedDB.`);
  }
}

const ALL_INITIAL_DECKS: Deck[] = [MASTERBANK_DECK, ...INITIAL_DECKS];
const ALL_INITIAL_CARDS: Flashcard[] = [...MASTERBANK_CARDS, ...INITIAL_CARDS];

/**
 * Hydrates state from IndexedDB at app initialization.
 * Returns hydrated decks, cards and stats without storage quota limits.
 */
export async function hydrateFromIndexedDb(): Promise<{
  cards: Flashcard[];
  decks: Deck[];
  stats: StudyStats;
}> {
  try {
    const [dbCards, dbDecks, dbStats] = await Promise.all([
      idbLoadCards(),
      idbLoadDecks(),
      idbLoadStats(),
    ]);

    if (dbCards && dbCards.length > 0) {
      memoryCards = dbCards;
    }
    if (dbDecks && dbDecks.length > 0) {
      memoryDecks = dbDecks;
    }
    if (dbStats) {
      memoryStats = dbStats;
    }
  } catch (e) {
    console.warn('Hydration from IndexedDB warning:', e);
  }

  return {
    cards: loadCards(),
    decks: loadDecks(),
    stats: loadStats(),
  };
}

export function loadDecks(): Deck[] {
  if (memoryDecks && memoryDecks.length > 0) {
    return memoryDecks;
  }

  const stored = getStored<Deck[]>(STORAGE_KEYS.DECKS, []);
  if (!stored || stored.length === 0) {
    memoryDecks = ALL_INITIAL_DECKS;
    idbSaveDecks(ALL_INITIAL_DECKS);
    setStored(STORAGE_KEYS.DECKS, ALL_INITIAL_DECKS);
    return ALL_INITIAL_DECKS;
  }

  // Ensure Masterbank deck is always present
  if (!stored.some((d) => d.id === MASTERBANK_DECK.id)) {
    const updated = [MASTERBANK_DECK, ...stored];
    memoryDecks = updated;
    idbSaveDecks(updated);
    setStored(STORAGE_KEYS.DECKS, updated);
    return updated;
  }

  memoryDecks = stored;
  return stored;
}

export function saveDecks(decks: Deck[]): void {
  memoryDecks = decks;
  idbSaveDecks(decks);
  setStored(STORAGE_KEYS.DECKS, decks);
}

export function loadCards(): Flashcard[] {
  if (memoryCards && memoryCards.length > 0) {
    return memoryCards;
  }

  const stored = getStored<Flashcard[]>(STORAGE_KEYS.CARDS, []);
  if (!stored || stored.length === 0) {
    memoryCards = MASTERBANK_CARDS;
    idbSaveCards(MASTERBANK_CARDS);
    return MASTERBANK_CARDS;
  }

  memoryCards = stored;
  return stored;
}

export function saveCards(cards: Flashcard[]): void {
  memoryCards = cards;

  // 1. Unlimited quota storage via IndexedDB
  idbSaveCards(cards);

  // 2. Safe minimal metadata storage in localStorage to prevent QuotaExceededError
  try {
    const minimal = cards.map((c) => ({
      id: c.id,
      deckId: c.deckId,
      kategori: c.kategori,
      emne: c.emne,
      korttype: c.korttype,
      niva: c.niva,
      forside: c.forside,
      bakside: c.bakside,
      referansehenvisning: c.referansehenvisning,
      design: c.design,
      isFavorite: c.isFavorite,
      srs: c.srs,
      variantId: c.variantId,
      originalKortId: c.originalKortId,
    }));
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(minimal));
  } catch (e) {
    // QuotaExceededError is caught safely without interrupting user experience
    console.warn('localStorage full - alle kort lagres trygt i IndexedDB.');
  }
}

const DEFAULT_STATS: StudyStats = {
  totalReviews: 28,
  totalCards: 2104,
  correctReviews: 24,
  wrongReviews: 4,
  streakDays: 5,
  lastActiveDate: new Date().toISOString().split('T')[0],
  retentionRate: 86,
  timeSpentMinutes: 45,
  dailyReviews: {
    [new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0]]: 5,
    [new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]]: 8,
    [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: 6,
    [new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0]]: 7,
    [new Date().toISOString().split('T')[0]]: 2,
  },
  categoryStats: {
    'Akuttmedisin': { total: 10, correct: 9, wrong: 1 },
    'Kardiologi': { total: 8, correct: 7, wrong: 1 },
    'Farmakologi': { total: 6, correct: 5, wrong: 1 },
    'Nevrologi & Traume': { total: 4, correct: 3, wrong: 1 },
  },
  weakTopics: [
    { topic: 'Glasgow Coma Scale (GCS)', wrongCount: 2, category: 'Nevrologi & Traume' },
    { topic: 'Formel for volum og infusjonshastighet', wrongCount: 1, category: 'Legemiddelregning' },
  ],
  history: [],
};

export function loadStats(): StudyStats {
  if (memoryStats) {
    return memoryStats;
  }
  const stored = getStored<StudyStats>(STORAGE_KEYS.STATS, DEFAULT_STATS);
  memoryStats = {
    ...DEFAULT_STATS,
    ...stored,
    categoryStats: stored.categoryStats || DEFAULT_STATS.categoryStats,
    weakTopics: stored.weakTopics || DEFAULT_STATS.weakTopics,
  };
  return memoryStats;
}

export function saveStats(stats: StudyStats): void {
  memoryStats = stats;
  idbSaveStats(stats);
  setStored(STORAGE_KEYS.STATS, stats);
}

// Spaced Repetition calculation (SM-2 + Leitner Boxes)
export function calculateNextSRS(
  currentSRS: Flashcard['srs'],
  rating: 'again' | 'hard' | 'good' | 'easy'
): Flashcard['srs'] {
  let { box, repetitionCount, easeFactor, intervalDays } = currentSRS || {
    box: 1,
    repetitionCount: 0,
    easeFactor: 2.5,
    intervalDays: 1,
    dueDate: Date.now(),
    history: [],
  };
  const now = Date.now();

  if (rating === 'again') {
    box = 1;
    repetitionCount = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'hard') {
    box = Math.max(1, box);
    intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    repetitionCount += 1;
  } else if (rating === 'good') {
    box = Math.min(5, box + 1);
    intervalDays = Math.round(intervalDays * easeFactor);
    repetitionCount += 1;
  } else if (rating === 'easy') {
    box = Math.min(5, box + 1);
    intervalDays = Math.round(intervalDays * easeFactor * 1.3);
    easeFactor = Math.min(3.0, easeFactor + 0.15);
    repetitionCount += 1;
  }

  const dueDate = now + intervalDays * 86400000;
  const history = [...(currentSRS?.history || []), { timestamp: now, rating }];

  return {
    box,
    repetitionCount,
    easeFactor: Number(easeFactor.toFixed(2)),
    intervalDays,
    dueDate,
    lastReviewed: now,
    history,
  };
}

export function updateStatsAfterReview(
  rating: 'again' | 'hard' | 'good' | 'easy',
  card?: Flashcard
): StudyStats {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0];

  const isCorrect = rating === 'good' || rating === 'easy';
  const newTotalReviews = stats.totalReviews + 1;
  const newCorrectReviews = (stats.correctReviews || 0) + (isCorrect ? 1 : 0);
  const newWrongReviews = (stats.wrongReviews || 0) + (!isCorrect ? 1 : 0);
  const newRetention = Math.round((newCorrectReviews / Math.max(1, newTotalReviews)) * 100);

  // Update daily reviews count
  const dailyReviews = { ...stats.dailyReviews };
  dailyReviews[today] = (dailyReviews[today] || 0) + 1;

  // Streak calculation
  let streak = stats.streakDays;
  if (stats.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (stats.lastActiveDate === yesterday) {
      streak += 1;
    } else if (stats.lastActiveDate < yesterday) {
      streak = 1;
    }
  }

  // Category and Weak topic tracking
  const categoryStats = { ...(stats.categoryStats || {}) };
  const weakTopics = [...(stats.weakTopics || [])];

  if (card) {
    const cat = card.kategori || 'Generell';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, correct: 0, wrong: 0 };
    }
    categoryStats[cat].total += 1;
    if (isCorrect) {
      categoryStats[cat].correct += 1;
    } else {
      categoryStats[cat].wrong += 1;
      const topicName = card.emne || card.question.slice(0, 30);
      const existingWeak = weakTopics.find((w) => w.topic === topicName);
      if (existingWeak) {
        existingWeak.wrongCount += 1;
      } else {
        weakTopics.push({ topic: topicName, wrongCount: 1, category: cat });
      }
    }
  }

  const updated: StudyStats = {
    ...stats,
    totalReviews: newTotalReviews,
    correctReviews: newCorrectReviews,
    wrongReviews: newWrongReviews,
    retentionRate: newRetention,
    streakDays: streak,
    lastActiveDate: today,
    dailyReviews,
    categoryStats,
    weakTopics: weakTopics.sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 10),
  };

  saveStats(updated);
  return updated;
}

export function saveSessionResult(result: StudySessionResult): void {
  const stats = loadStats();
  const history = [result, ...(stats.history || [])].slice(0, 50);
  const minutes = Math.round(result.durationSeconds / 60);

  const updated: StudyStats = {
    ...stats,
    timeSpentMinutes: stats.timeSpentMinutes + Math.max(1, minutes),
    history,
  };
  saveStats(updated);
}

// Offline Shield Preference
export function getOfflineShieldSetting(): boolean {
  return getStored<boolean>(STORAGE_KEYS.OFFLINE_ONLY, false);
}

export function setOfflineShieldSetting(val: boolean): void {
  setStored(STORAGE_KEYS.OFFLINE_ONLY, val);
}

// Reset data to master data
export function resetAllDataToDefault(): void {
  memoryDecks = ALL_INITIAL_DECKS;
  memoryCards = ALL_INITIAL_CARDS;
  memoryStats = DEFAULT_STATS;
  idbSaveDecks(ALL_INITIAL_DECKS);
  idbSaveCards(ALL_INITIAL_CARDS);
  idbSaveStats(DEFAULT_STATS);
  setStored(STORAGE_KEYS.DECKS, ALL_INITIAL_DECKS);
  setStored(STORAGE_KEYS.STATS, DEFAULT_STATS);
}

// Secure Purge
export function purgeAllDataSecurely(): void {
  memoryCards = [];
  memoryDecks = [];
  memoryStats = null;
  idbSaveCards([]);
  idbSaveDecks([]);
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
