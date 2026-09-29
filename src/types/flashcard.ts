export type CardDesignFamily =
  | 'Clinical'
  | 'Dark Premium'
  | 'Nordic'
  | 'Minimal'
  | 'Academic'
  | 'Anatomy'
  | 'Emergency'
  | 'Medication'
  | 'Case'
  | 'Exam'
  | 'Research'
  | 'Timeline'
  | 'Process'
  | 'Comparison'
  | 'Decision Tree'
  | 'Diagram'
  | 'Image First'
  | 'Memory'
  | 'Premium'
  | 'Formula'
  | 'Definition'
  | 'Modern'
  | 'Glass'
  | 'Case Study'
  | 'Memory Palace'
  | 'Editorial'
  | 'High Contrast'
  | 'Quick Recall'
  | 'Deep Recall'
  | 'Scenario'
  | 'Light Premium'
  | 'Microbiology'
  | 'Psychology'
  | 'Reflection'
  | 'Premium Academic';

// Legacy alias compatibility
export type CardDesignTheme = CardDesignFamily;

export type CardStatus =
  | 'KLAR'
  | 'KLAR_MEN_SAMMENSLÅTT'
  | 'TEMAREFERANSE'
  | 'USIKKER_KOBLING'
  | 'KREVER_KONTROLL'
  | 'KREVER_FAGLIG_KONTROLL'
  | 'MANGLER_SVAR'
  | 'MANGLER_REFERANSE'
  | 'IKKE_KORTINNHOLD';

export type ReferanseKobling = 'DIREKTE' | 'TEMAREFERANSE' | 'USIKKER_KOBLING' | 'KREVER_KONTROLL';

export type Korttype =
  | 'Definisjon'
  | 'Klinisk observasjon'
  | 'Hurtigrepetisjon'
  | 'Dyp gjenhenting'
  | 'Case'
  | 'Scenario'
  | 'Eksamen'
  | 'Flervalg'
  | 'Sant/Usant'
  | 'Hva gjør du først?'
  | 'Årsak/konsekvens'
  | 'Prosess'
  | 'Sammenligning'
  | 'Beslutningstre'
  | 'Refleksjon'
  | 'Bildekort'
  | 'Legemiddelregning'
  | 'Formel/Regning';

export type Niva = 'Grunnleggende' | 'Middels' | 'Avansert';

export interface QualityChecklist {
  cardId?: string;
  hasQuestion: boolean;
  hasAnswer: boolean;
  hasReference: boolean;
  hasKortId: boolean;
  hasKategori: boolean;
  validText: boolean;
  hasSource: boolean;
  validExportData: boolean;
  passedAll: boolean;
  issues: string[];
}

export interface Flashcard {
  id: string; // Stabil Kort-ID f.eks. FF-0001 eller FF-DOC1-Q000001
  variantId?: string; // e.g. FF-0001-V01
  originalKortId?: string; // peker til opprinnelig originalkort
  deckId: string;
  kategori: string;
  emne?: string;
  korttype: Korttype;
  niva: Niva;
  forside: string; // Spørsmål/case (REFERANSER SKAL ALDRI VISES HER)
  bakside: string; // Korrekt svar + forklaring
  referansehenvisning: string; // APA 7 kildehenvisning nederst på baksiden
  fullReferanse: string; // Full APA 7 bibliografi
  kildedokument?: string;
  kildeseksjon?: string;
  design: CardDesignFamily;
  bildestatus: 'lokal_svg' | 'kildebilde' | 'ingen';
  bildeData?: {
    position: 'top' | 'side' | 'back';
    url?: string;
    svgContent?: string;
    alt?: string;
    isIllustrationNotice?: boolean;
  };
  status: CardStatus;
  referanseKobling: ReferanseKobling;
  tagger: string[];
  sammenslattFra?: string[];
  isFavorite?: boolean;
  qualityAudit?: QualityChecklist;

  // Aliases for compatibility
  question: string;
  answer: string;
  reference: string;
  frontExtra?: string;
  backExtra?: string;
  tags?: string[];
  image?: {
    position: 'top' | 'side' | 'back';
    url?: string;
    svgContent?: string;
    alt?: string;
  };
  createdAt: number;
  updatedAt: number;
  srs?: {
    box: number; // 1 til 5 Leitner-boks
    repetitionCount: number;
    easeFactor: number;
    intervalDays: number;
    dueDate: number;
    lastReviewed?: number;
    history?: Array<{
      timestamp: number;
      rating: 'again' | 'hard' | 'good' | 'easy';
    }>;
  };
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  kategori?: string;
  tags: string[];
  defaultDesign: CardDesignFamily;
  createdAt: number;
  updatedAt: number;
  sourceType?: 'excel' | 'word' | 'pdf' | 'csv' | 'manual' | 'ai';
  sourceFileName?: string;
}

// Extracted non-flashcard study content (worksheets, checklists, study reading, cases)
export type StudyContentType =
  | 'arbeidsark'
  | 'sjekkliste'
  | 'lesestoff'
  | 'case'
  | 'forskningsmetode'
  | 'refleksjon'
  | 'studieplan';

export interface StudyContentItem {
  id: string;
  type: StudyContentType;
  title: string;
  content: string;
  sourceFile: string;
  sourceSection?: string;
  page?: number;
  category: string;
  tags: string[];
  createdAt: number;
}

// Automated Study Plan
export interface StudyPlanGoal {
  id: string;
  title: string;
  category: string;
  targetCards: number;
  completedCards: number;
  dueDay: string; // YYYY-MM-DD
  isCompleted: boolean;
  type: 'daily' | 'weekly' | 'exam_prep' | 'weak_topics';
}

export interface StudyPlan {
  deckId: string;
  dailyGoalCards: number;
  weeklyGoalCards: number;
  examDate?: string;
  goals: StudyPlanGoal[];
  weakTopicsFocus: string[];
  lastUpdated: number;
}

export interface StudySessionResult {
  deckId: string;
  cardsReviewed: number;
  ratings: {
    again: number;
    hard: number;
    good: number;
    easy: number;
    skippedRating?: number;
  };
  durationSeconds: number;
  timestamp: number;
}

export interface StudyStats {
  totalReviews: number;
  totalCards: number;
  correctReviews: number;
  wrongReviews: number;
  streakDays: number;
  lastActiveDate: string;
  retentionRate: number;
  timeSpentMinutes: number;
  dailyReviews: Record<string, number>;
  categoryStats: Record<string, { total: number; correct: number; wrong: number }>;
  history?: StudySessionResult[];
  weakTopics?: Array<{ topic: string; wrongCount: number; category?: string }>;
}

export interface CardVariationProposal {
  variantType: string;
  title: string;
  korttype: Korttype;
  niva: Niva;
  forside: string;
  bakside: string;
  referansehenvisning: string;
  fullReferanse: string;
  design: CardDesignFamily;
  svgContent?: string;
  begrunnelse: string;
  tagger: string[];
}

export interface ParsedCardDraft {
  kortId?: string;
  kategori?: string;
  emne?: string;
  korttype?: Korttype;
  niva?: Niva;
  forside?: string;
  bakside?: string;
  referansehenvisning?: string;
  fullReferanse?: string;
  kildedokument?: string;
  kildeseksjon?: string;
  design?: CardDesignFamily;
  status?: CardStatus;
  referanseKobling?: ReferanseKobling;
  tagger?: string[];
  question: string;
  answer: string;
  reference: string;
  frontExtra?: string;
  backExtra?: string;
  tags?: string[];
  suggestedDesign?: CardDesignFamily;
  imageUrl?: string;
  svgIllustration?: string;
  selected?: boolean;
}

export interface QualityAuditResult {
  cardId?: string;
  hasQuestion: boolean;
  hasAnswer: boolean;
  hasReference: boolean;
  hasKortId: boolean;
  hasKategori: boolean;
  validText: boolean;
  hasSource: boolean;
  validExportData: boolean;
  passedAll: boolean;
  issues: string[];
}

export type PipelineStage =
  | 'IMPORT'
  | 'ANALYSER'
  | 'VALIDER'
  | 'OPPRETT_KORT'
  | 'DESIGN'
  | 'ILLUSTRASJON'
  | 'LAGRING'
  | 'STATISTIKK'
  | 'EKSPORT'
  | 'FULLFØRT';

export interface BatchJobState {
  jobId: string;
  totalItems: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  currentStage: PipelineStage;
  stageProgressPercent: number;
  isPaused: boolean;
  isCompleted: boolean;
  checkpointTimestamp: number;
  logs: string[];
  failedItems: Array<{
    itemIndex: number;
    rawText: string;
    reason: string;
  }>;
}
