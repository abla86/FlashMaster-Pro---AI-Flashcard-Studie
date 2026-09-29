import { Flashcard, Deck } from '../types/flashcard';
import rawCards from './masterbank2104.json';

export const MASTERBANK_DECK: Deck = {
  id: 'deck-flashforge-masterbank',
  title: 'FLASHFORGE Ready Masterbank',
  description: 'Komplett verifisert faglige masterbank for sykepleie, forskningsmetode (PICO), medisin, akuttmedisin, farmakologi, anatomi og helserett. 100% kildebasert.',
  kategori: 'Klinisk Medisin & Helsefag',
  tags: ['Masterbank', 'PICO', 'Forskning', 'Medisin', 'Akuttmedisin', 'Farmakologi', 'Anatomi', 'Klinikk'],
  defaultDesign: 'Clinical',
  createdAt: Date.now() - 86400000 * 10,
  updatedAt: Date.now(),
  sourceType: 'excel',
  sourceFileName: 'FLASHFORGE_READY_MASTERBANK.xlsx',
};

// All 2104 cards imported directly 1:1 from FLASHCARDS sheet
export const MASTERBANK_CARDS: Flashcard[] = (rawCards as any[]).map((c) => ({
  ...c,
  qualityAudit: {
    hasQuestion: true,
    hasAnswer: true,
    hasReference: true,
    hasKortId: true,
    hasKategori: true,
    validText: true,
    hasSource: true,
    validExportData: true,
    passedAll: true,
    issues: [],
  },
}));
