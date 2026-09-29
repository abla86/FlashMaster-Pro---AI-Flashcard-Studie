import {
  Flashcard,
  Deck,
  CardDesignFamily,
  CardStatus,
  ReferanseKobling,
  QualityAuditResult,
  PipelineStage,
  BatchJobState,
} from '../types/flashcard';
import { getDeterministicSvgForTopic } from './svgLibrary';
import { sanitizeInput } from './fileParsers';
import { saveCards, loadCards, saveDecks, loadDecks } from './storage';

const CHECKPOINT_STORAGE_KEY = 'flashforge_batch_checkpoint_v1';

// Quality control validator according to FlashForge specifications
export function auditFlashcardQuality(card: Partial<Flashcard>): QualityAuditResult {
  const issues: string[] = [];

  const q = (card.forside || card.question || '').trim();
  const a = (card.bakside || card.answer || '').trim();
  const r = (card.referansehenvisning || card.reference || '').trim();
  const id = (card.id || '').trim();
  const kat = (card.kategori || '').trim();
  const kilde = (card.kildedokument || '').trim();

  const hasQuestion = q.length >= 5;
  if (!hasQuestion) issues.push('Mangler eller for kort spørsmål (minimum 5 tegn)');

  const hasAnswer = a.length >= 3;
  if (!hasAnswer) issues.push('Mangler eller for kort svar (minimum 3 tegn)');

  const hasReference = r.length >= 3;
  if (!hasReference) issues.push('Mangler referanse eller kildehenvisning');

  const hasKortId = id.length >= 3;
  if (!hasKortId) issues.push('Mangler stabil Kort-ID');

  const hasKategori = kat.length >= 2;
  if (!hasKategori) issues.push('Mangler kategori/emne');

  const hasSource = kilde.length > 0 || (card.fullReferanse || '').trim().length > 0;
  if (!hasSource) issues.push('Mangler kildedokument eller full referanse');

  // Verify text doesn't contain corrupt binary or excessive special characters
  const validText = !/[<>{}\\]{5,}/.test(q) && !/[<>{}\\]{5,}/.test(a);
  if (!validText) issues.push('Ugyldig eller korrupt tekstformat oppdaget');

  // Verify export data can be generated safely (tab/newline separation test)
  const validExportData = !q.includes('\t') && !r.includes('\t');
  if (!validExportData) issues.push('Inneholder tabulatortegn som kan forstyrre eksport til Anki/Quizlet');

  const passedAll =
    hasQuestion &&
    hasAnswer &&
    hasReference &&
    hasKortId &&
    hasKategori &&
    hasSource &&
    validText &&
    validExportData;

  return {
    hasQuestion,
    hasAnswer,
    hasReference,
    hasKortId,
    hasKategori,
    validText,
    hasSource,
    validExportData,
    passedAll,
    issues,
  };
}

// Select modern design based on content
export function selectAutomaticDesign(
  kategori: string = '',
  emne: string = '',
  forside: string = '',
  bakside: string = ''
): CardDesignFamily {
  const text = `${kategori} ${emne} ${forside} ${bakside}`.toLowerCase();

  if (text.match(/stemi|ekg|akutt|sjokk|triage|livredning|resuscitering|gjenoppliving|luftvei/)) {
    return 'Emergency';
  }
  if (text.match(/anatomi|kransarterie|lad|lcx|hjerte|skjelett|muskel|organ|arterie|vene/)) {
    return 'Anatomy';
  }
  if (text.match(/medikament|legemiddel|dose|styrke|volum|mg\/ml|infusjon|morfin|adrenalin|tablett/)) {
    return 'Medication';
  }
  if (text.match(/pasient|klinikk|kasus|kvinne|mann|klager over|innleggelse|innlagt|akuttmottak/)) {
    return 'Case';
  }
  if (text.match(/eksamen|vurdering|poeng|kriterier|maksimal skår|skåring|test|karakter/)) {
    return 'Exam';
  }
  if (text.match(/forskning|studie|jama|lancet|cochrane|signifikant|p-verdi|meta-analyse|evidens/)) {
    return 'Research';
  }
  if (text.match(/prosess|trinn|arbeidsflyt|flytskjema|algoritme|først deretter|steg for steg/)) {
    return 'Process';
  }
  if (text.match(/tidslinje|historie|kronologi|utvikling|årstall|fase 1|fase 2/)) {
    return 'Timeline';
  }
  if (text.match(/forskjell|sammenligning|vs|motsetning|versus|kontra|likheter/)) {
    return 'Comparison';
  }
  if (text.match(/beslutning|hvis|dersom|indikasjon|kontraindikasjon|algoritmetre/)) {
    return 'Decision Tree';
  }
  if (text.match(/skjema|diagram|kurve|graf|vektor|modell/)) {
    return 'Diagram';
  }
  if (text.match(/lov|paragraf|helserett|helsepersonellov|rettighet|plikt|juridisk/)) {
    return 'Academic';
  }
  if (text.match(/huskeregel|mnemonics|assosiasjon|mnemo/)) {
    return 'Memory';
  }
  if (text.match(/definisjon|hva er|betyr|begrep/)) {
    return 'Minimal';
  }
  if (text.match(/klinisk|behandling|symptom|diagnose|prøvesvar|laboratorie/)) {
    return 'Clinical';
  }

  return 'Dark Premium';
}

// Convert raw row to a complete, validated Flashcard
export function convertRawToFlashcard(
  row: Record<string, any>,
  index: number,
  deckId: string,
  fileName: string = 'FLASHFORGE_READY_MASTERBANK.xlsx'
): Flashcard {
  const rawId =
    row['Kort-ID'] ||
    row['kort-id'] ||
    row['id'] ||
    row['KortID'] ||
    `FF-${String(index + 1).padStart(3, '0')}`;

  const kategori = sanitizeInput(row['Kategori'] || row['kategori'] || 'Generell');
  const emne = sanitizeInput(row['Emne'] || row['emne'] || kategori);
  const korttype = (row['Korttype'] || 'Klinisk observasjon') as any;
  const niva = (row['Nivå'] || row['Niva'] || 'Middels') as any;

  // Front and Back
  const forside = sanitizeInput(
    row['Forside'] ||
    row['forside'] ||
    row['Spørsmål'] ||
    row['spørsmål'] ||
    row['Question'] ||
    ''
  );

  const bakside = sanitizeInput(
    row['Bakside'] ||
    row['bakside'] ||
    row['Svar'] ||
    row['svar'] ||
    row['Answer'] ||
    ''
  );

  // References
  const referansehenvisning = sanitizeInput(
    row['Referansehenvisning'] ||
    row['referansehenvisning'] ||
    row['Referanse'] ||
    row['referanse'] ||
    `${fileName}, rad ${index + 2}`
  );

  const fullReferanse = sanitizeInput(
    row['Full Referanse'] ||
    row['fullReferanse'] ||
    row['Kilde'] ||
    referansehenvisning
  );

  const kildedokument = sanitizeInput(row['Kildedokument'] || fileName);
  const kildeseksjon = sanitizeInput(row['Kildeseksjon'] || `Seksjon ${index + 1}`);

  // Design
  const rawDesign = row['Design'] || row['design'];
  const design: CardDesignFamily = rawDesign
    ? (rawDesign as CardDesignFamily)
    : selectAutomaticDesign(kategori, emne, forside, bakside);

  // Tags
  const rawTags = row['Tagger'] || row['tagger'] || row['Tags'] || '';
  const tagger = typeof rawTags === 'string'
    ? rawTags.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
    : Array.isArray(rawTags)
    ? rawTags
    : [kategori, emne];

  // Determine illustration needs (Requirement 4)
  const topicCombined = `${kategori} ${emne} ${forside} ${bakside}`;
  const needsSvg =
    topicCombined.match(/anatomi|lad|lcx|abcde|ekg|stemi|adrenalin|volum|gcs|sepsis|qsofa|paragraf|hjerte|infusjon|regning/) !== null;

  const svgContent = needsSvg ? getDeterministicSvgForTopic(topicCombined, korttype) : undefined;
  const bildestatus = svgContent ? 'lokal_svg' : 'ingen';

  // Base card object
  const card: Flashcard = {
    id: rawId,
    deckId,
    kategori,
    emne,
    korttype,
    niva,
    forside,
    bakside,
    referansehenvisning,
    fullReferanse,
    kildedokument,
    kildeseksjon,
    design,
    bildestatus,
    bildeData: svgContent
      ? {
          position: 'side',
          svgContent,
          alt: `${emne} pedagogisk illustrasjon`,
          isIllustrationNotice: true,
        }
      : undefined,
    status: 'KLAR',
    referanseKobling: (row['Referansekobling'] as ReferanseKobling) || 'DIREKTE',
    tagger,

    // Aliases
    question: forside,
    answer: bakside,
    reference: referansehenvisning,
    tags: tagger,

    createdAt: Date.now() - (index + 1) * 3600000,
    updatedAt: Date.now(),
    srs: {
      box: 1,
      repetitionCount: 0,
      easeFactor: 2.5,
      intervalDays: 1,
      dueDate: Date.now(),
      history: [],
    },
  };

  // Run Quality Audit
  const audit = auditFlashcardQuality(card);
  card.qualityAudit = audit;

  if (!audit.passedAll) {
    if (!audit.hasAnswer) card.status = 'MANGLER_SVAR';
    else if (!audit.hasReference) card.status = 'MANGLER_REFERANSE';
    else card.status = 'KREVER_FAGLIG_KONTROLL';
  }

  return card;
}

// Persistent Checkpoint Manager
export function saveCheckpoint(state: BatchJobState, processedCards: Flashcard[]): void {
  try {
    localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify({ state, processedCards }));
  } catch (e) {
    console.warn('Failed to save checkpoint to localStorage:', e);
  }
}

export function loadCheckpoint(): { state: BatchJobState; processedCards: Flashcard[] } | null {
  try {
    const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load checkpoint:', e);
    return null;
  }
}

export function clearCheckpoint(): void {
  try {
    localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear checkpoint:', e);
  }
}
