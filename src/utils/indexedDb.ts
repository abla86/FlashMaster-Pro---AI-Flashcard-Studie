// IndexedDB Storage Engine for FlashForge Pro
// Solves localStorage 5MB quota exhaustion for 2104, 2604, and 10,000+ cards
// 100% offline, zero external dependencies, robust and fast.

import { Deck, Flashcard, StudyStats, StudyContentItem } from '../types/flashcard';

const DB_NAME = 'flashforge_db_v2';
const DB_VERSION = 2;

const STORES = {
  CARDS: 'cards',
  DECKS: 'decks',
  STATS: 'stats',
  CONTENT: 'study_content',
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB ikke tilgjengelig i dette miljøet'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.CARDS)) {
        db.createObjectStore(STORES.CARDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.DECKS)) {
        db.createObjectStore(STORES.DECKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.STATS)) {
        db.createObjectStore(STORES.STATS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CONTENT)) {
        db.createObjectStore(STORES.CONTENT, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. CARDS
export async function idbSaveCards(cards: Flashcard[]): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.CARDS, 'readwrite');
    const store = tx.objectStore(STORES.CARDS);

    // Clear existing to prevent ghost cards
    store.clear();

    for (const card of cards) {
      store.put(card);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('IndexedDB feil ved lagring av kort:', err);
  }
}

export async function idbLoadCards(): Promise<Flashcard[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.CARDS, 'readonly');
    const store = tx.objectStore(STORES.CARDS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB feil ved lasting av kort, faller tilbake:', err);
    return [];
  }
}

// 2. DECKS
export async function idbSaveDecks(decks: Deck[]): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.DECKS, 'readwrite');
    const store = tx.objectStore(STORES.DECKS);
    store.clear();

    for (const deck of decks) {
      store.put(deck);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('IndexedDB feil ved lagring av dekk:', err);
  }
}

export async function idbLoadDecks(): Promise<Deck[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.DECKS, 'readonly');
    const store = tx.objectStore(STORES.DECKS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB feil ved lasting av dekk:', err);
    return [];
  }
}

// 3. STATS
export async function idbSaveStats(stats: StudyStats): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.STATS, 'readwrite');
    const store = tx.objectStore(STORES.STATS);
    store.put({ id: 'main_stats', ...stats });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('IndexedDB feil ved lagring av statistikk:', err);
  }
}

export async function idbLoadStats(): Promise<StudyStats | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORES.STATS, 'readonly');
    const store = tx.objectStore(STORES.STATS);
    const request = store.get('main_stats');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          const { id, ...data } = request.result;
          resolve(data as StudyStats);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB feil ved lasting av stats:', err);
    return null;
  }
}
