// Universal Document Model & Types for FlashForge Document Engine
// Zero-data-loss representation from Document -> Sections -> Blocks -> Items -> Flashcards

import { CardDesignFamily, Flashcard } from '../types/flashcard';

export type BlockType = 'heading' | 'paragraph' | 'table' | 'list_item' | 'callout' | 'metadata';

export interface DocumentBlock {
  id: string;
  type: BlockType;
  text: string;
  level?: number;             // Heading level (1, 2, 3)
  page?: number;              // Document page
  section?: string;           // Section/Chapter title
  paragraphIndex: number;
  tableData?: string[][];     // 2D grid if table
  tableHeaders?: string[];    // Header columns if table
  isBold?: boolean;
  metadata?: Record<string, any>;
}

export type ItemStatus =
  | 'IMPORTED'
  | 'SKIPPED_WITH_REASON'
  | 'NEEDS_REVIEW'
  | 'PARSED_AS_METADATA';

export interface NormalizedDocumentItem {
  importId: string;           // e.g. FF-DOC1-Q000001
  sourceFile: string;
  sourceSection: string;
  sourcePage: number;
  sourceParagraph: number;
  sourceTable?: string;
  originalNumber?: string;
  question: string;           // Forside (Spørsmål/Begrep/Case)
  answer: string;             // Bakside (Korrekt svar/Forklaring)
  reference: string;          // Bakside APA 7 in-text citation
  fullReference?: string;     // Bakside full APA 7 bibliographic reference
  category: string;
  emne: string;
  design: CardDesignFamily;
  status: ItemStatus;
  skipReason?: string;
  metadata: Record<string, any>;
  hasSvgIllustration?: boolean;
}

export interface DocumentAuditReport {
  fileName: string;
  fileSize: number;
  totalPages: number;
  totalBlocks: number;
  questionsFound: number;
  answersFound: number;
  referencesFound: number;
  tablesFound: number;
  sectionsFound: number;
  importedCount: number;
  notInterpretedCount: number;
  needsReviewCount: number;
  errorsCount: number;
  dataLoss: number;           // Must be 0
  items: NormalizedDocumentItem[];
  auditLog: string[];
}

export interface DocumentExtractionProgress {
  fileName: string;
  currentPage: number;
  totalPages: number;
  currentBlock: number;
  totalBlocks: number;
  questions: number;
  answers: number;
  references: number;
  cards: number;
  errors: number;
  remaining: number;
  percent: number;
  statusText: string;
}
