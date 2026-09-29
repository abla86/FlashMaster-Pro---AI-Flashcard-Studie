import { Flashcard, CardDesignFamily, QualityAuditResult, Deck } from '../types/flashcard';
import { auditFlashcardQuality, selectAutomaticDesign } from './batchPipeline';
import { getDeterministicSvgForTopic } from './svgLibrary';
import masterbankCardsJson from './masterbank2104.json';
import { exportStandaloneWindowsPackage } from './fileExporters';

export interface PipelineSummaryReport {
  excelRows: number;
  importedOriginals: number;
  notImported: number;
  variantsGenerated: number;
  totalCards: number;
  questionsCount: number;
  answersCount: number;
  referencesCount: number;
  designsAssigned: number;
  illustrationsCreated: number;
  controlCards: number;
  exportReady: boolean;
  stageLogs: string[];
}

export type PipelineStep =
  | 'IDLE'
  | 'IMPORT'
  | 'VALIDER'
  | 'ORIGINALKORT'
  | 'DESIGN'
  | 'ILLUSTRASJON'
  | 'LÆRINGSVARIANTER'
  | 'KVALITETSKONTROLL'
  | 'STUDIEPLAN'
  | 'STATISTIKK'
  | 'LAGRING'
  | 'EKSPORT'
  | 'FULLFØRT';

// Generate relevant pedagogical variants locally from original card
export function generateLocalCardVariants(originalCard: Flashcard): Flashcard[] {
  const variants: Flashcard[] = [];
  const origId = originalCard.id;
  const q = originalCard.forside || originalCard.question;
  const a = originalCard.bakside || originalCard.answer;
  const refDirect = originalCard.referansehenvisning || originalCard.reference;
  const refFull = originalCard.fullReferanse || refDirect;
  const kat = originalCard.kategori || 'Fag';
  const emne = originalCard.emne || kat;

  // 1. Quick Recall Variant (Konsis nøkkeltest)
  const quickQ = `[Quick Recall] ${q}`;
  const quickA = a.split('\n\n')[0] || a;
  variants.push({
    ...originalCard,
    id: `${origId}-VAR-QUICK`,
    forside: quickQ,
    bakside: quickA,
    question: quickQ,
    answer: quickA,
    korttype: 'Hurtigrepetisjon',
    design: 'Minimal',
    niva: 'Grunnleggende',
    tagger: [...(originalCard.tagger || []), 'Quick Recall', 'Variant'],
    tags: [...(originalCard.tags || []), 'Quick Recall'],
    sammenslattFra: [origId],
    srs: {
      box: 1,
      repetitionCount: 0,
      easeFactor: 2.5,
      intervalDays: 1,
      dueDate: Date.now(),
      history: [],
    },
  });

  // 2. Case / Scenario / "Hva gjør du først?" Variant (Dersom kortet er klinisk eller akutt)
  if (
    kat.match(/akutt|klinikk|kardiologi|farmakologi|nevrologi|infeksjon|sepsis/i) ||
    q.match(/pasient|behandling|symptom|undersøkelse|akutt|gcs|stemi/i)
  ) {
    const caseQ = `[Klinisk Scenario & Prioritering]\nPasient vurderes på post/legevakt. Hva er førstehåndstiltak og prioritert handlingsrekkefølge basert på:\n${q}`;
    const caseA = `Klinisk prioritering:\n${a}\n\nKlinisk begrunnelse: Rask iverksettelse basert på etablerte nasjonale retningslinjer.`;
    variants.push({
      ...originalCard,
      id: `${origId}-VAR-CASE`,
      forside: caseQ,
      bakside: caseA,
      question: caseQ,
      answer: caseA,
      korttype: 'Case',
      design: 'Clinical',
      niva: 'Middels',
      tagger: [...(originalCard.tagger || []), 'Case', 'Scenario', 'Hva gjør du først?'],
      tags: [...(originalCard.tags || []), 'Case'],
      sammenslattFra: [origId],
      srs: {
        box: 1,
        repetitionCount: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        dueDate: Date.now(),
        history: [],
      },
    });
  }

  // 3. Eksamen / Dyp Læring / Årsak & Konsekvens
  if (originalCard.niva === 'Middels' || originalCard.niva === 'Avansert') {
    const examQ = `[Eksamensfokus & Årsak/Konsekvens]\nGjør rede for fysiologiske/faglige mekanismer, indikasjoner og fallgruver knyttet til:\n${q}`;
    const examA = `${a}\n\nFaglig begrunnelse & kontroll: Korrekt forståelse forutsetter kunnskap om underliggende fysiologi og evidensgrunnlag.`;
    variants.push({
      ...originalCard,
      id: `${origId}-VAR-EXAM`,
      forside: examQ,
      bakside: examA,
      question: examQ,
      answer: examA,
      korttype: 'Eksamen',
      design: 'Exam',
      niva: 'Avansert',
      tagger: [...(originalCard.tagger || []), 'Eksamen', 'Dyp Læring', 'Årsak/Konsekvens'],
      tags: [...(originalCard.tags || []), 'Eksamen'],
      sammenslattFra: [origId],
      srs: {
        box: 1,
        repetitionCount: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        dueDate: Date.now(),
        history: [],
      },
    });
  }

  return variants;
}

// Generate Standalone Windows Offline Desktop Package with embedded cards & modern theme switcher
export function generateStandaloneWindowsApp(allCards: Flashcard[]): void {
  const masterDeck: Deck = {
    id: 'master',
    title: 'FlashForge Pro Masterbank',
    description: 'Komplett offline kunnskapsbank med alle kort',
    tags: ['masterbank', 'offline', 'windows'],
    defaultDesign: 'Nordic',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  exportStandaloneWindowsPackage(masterDeck, allCards);
}
