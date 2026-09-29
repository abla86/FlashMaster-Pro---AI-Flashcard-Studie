import * as XLSX from 'xlsx';
import { CardDesignFamily, ParsedCardDraft } from '../types/flashcard';
import { cleanReferenceArtifacts, formatToApa7Reference } from './referenceFormatter';

export interface ExcelImportReport {
  totalRows: number;
  imported: number;
  notImported: number;
  questionsCount: number;
  answersCount: number;
  referencesCount: number;
  skippedDetails: Array<{ row: number; reason: string }>;
}

// Security: Sanitize text against XSS and script injections
export function sanitizeInput(text: unknown): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Match topic to design family based on keywords
export function detectDesignByTopic(text: string): CardDesignFamily {
  const lower = text.toLowerCase();
  if (lower.match(/pico|litteratur|forskn|studie|rct|cochrane|evidens|metode|syntese/)) {
    return 'Research';
  }
  if (lower.match(/stemi|ekg|akutt|sjokk|triage|livredning|resuscitering|abcde|luftvei|hjertestans/)) {
    return 'Emergency';
  }
  if (lower.match(/anatomi|kransarterie|lad|lcx|hjerte|skjelett|muskel|organ|arterie|vene|fysiologi/)) {
    return 'Anatomy';
  }
  if (lower.match(/medikament|legemiddel|dose|styrke|volum|mg\/ml|infusjon|morfin|adrenalin|tablett|virkningsmekanisme/)) {
    return 'Medication';
  }
  if (lower.match(/pasient|klinikk|kasus|kvinne|mann|innleggelse|innlagt|akuttmottak|ortostatisk|blodtrykksfall/)) {
    return 'Clinical';
  }
  if (lower.match(/eksamen|vurdering|poeng|kriterier|maksimal skår|skåring|test/)) {
    return 'Exam';
  }
  if (lower.match(/kode|python|javascript|sql|server|algoritme|data|cpu|ram/)) {
    return 'Process';
  }
  if (lower.match(/lov|paragraf|rett|domstol|helserett|helsepersonellov|grunnlov|taushetsplikt/)) {
    return 'Academic';
  }
  if (lower.match(/formel|fysikk|matte|kalkyle|termo|ingeniør|kraft|vektor/)) {
    return 'Formula';
  }
  if (lower.match(/definisjon|hva er|betyr|begrep/)) {
    return 'Minimal';
  }
  return 'Clinical';
}

/**
 * Intelligent Column Classifier:
 * Analyzes column headers AND cell content to identify Question (Forside),
 * Answer (Bakside - Forklaring), Reference (APA 7), Category, and ID.
 */
function identifyColumns(
  columns: string[],
  rows: Record<string, any>[]
): {
  idCol?: string;
  qCol: string;
  aCol: string;
  rCol?: string;
  fullRCol?: string;
  katCol?: string;
  emneCol?: string;
  typeCol?: string;
  nivaCol?: string;
  docCol?: string;
  secCol?: string;
  dCol?: string;
  statusCol?: string;
  tCol?: string;
  imgCol?: string;
} {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9æøå]/gi, '');

  const findMatch = (candidates: string[]) => {
    return columns.find((c) => {
      const n = norm(c);
      return candidates.some((cand) => n === norm(cand) || n.includes(norm(cand)));
    });
  };

  // 1. Explicit ID column
  const idCol = findMatch(['kortid', 'kort_id', 'id', 'nummer', 'nr', 'no']);

  // 2. Explicit Question/Term columns
  // Specifically supports 'begrep', 'term', 'tilstand', 'diagnose', 'emne', 'tema' like "Ortostatisk blodtrykksfall"
  let qCol = findMatch([
    'spørsmål',
    'forside',
    'question',
    'front',
    'begrep',
    'term',
    'diagnose',
    'tilstand',
    'kasus',
    'case',
    'problem',
    'problemstilling',
    'tittel',
    'navn',
    'emneord',
    'temaord',
    'nøkkelord',
    'stikkord',
    'oppgave',
    'indikasjon',
    'definisjonsord',
    'preparat',
  ]);

  // 3. Explicit Answer/Explanation columns
  // Specifically supports 'forklaring', 'definisjon', 'beskrivelse', 'klinisk bilde', 'svar', 'bakside', 'tiltak'
  let aCol = findMatch([
    'forklaring',
    'svar',
    'bakside',
    'definisjon',
    'beskrivelse',
    'answer',
    'back',
    'fasit',
    'løsning',
    'kliniskbilde',
    'tiltak',
    'mekanisme',
    'innhold',
    'betydning',
    'tekst',
  ]);

  // If qCol is not found but aCol is present, look for topic/term headers
  if (!qCol && aCol) {
    const fallbackQ = findMatch(['tema', 'emne', 'tittel', 'overskrift', 'kolonne1', 'tekst1', 'col1']);
    if (fallbackQ && fallbackQ !== aCol) {
      qCol = fallbackQ;
    }
  }

  // 4. Reference columns
  const rCol = findMatch([
    'referansehenvisning',
    'referanse',
    'kilde',
    'kildehenvisning',
    'reference',
    'ref',
    'source',
    'litteratur',
    'bibliografi',
  ]);
  const fullRCol = findMatch(['fullreferanse', 'full_referanse', 'full referanse', 'litteraturliste']);

  // 5. Metadata columns
  const katCol = findMatch(['kategori', 'category', 'fag', 'fagområde', 'modul']);
  const emneCol = findMatch(['emne', 'underkategori', 'subtopic', 'tema']);
  const typeCol = findMatch(['korttype', 'type']);
  const nivaCol = findMatch(['nivå', 'niva', 'level', 'vanskelighetsgrad']);
  const docCol = findMatch(['kildedokument', 'dokument', 'fil']);
  const secCol = findMatch(['kildeseksjon', 'seksjon', 'kapittel', 'side']);
  const dCol = findMatch(['design', 'tema', 'theme', 'stil']);
  const statusCol = findMatch(['status', 'tilstand']);
  const tCol = findMatch(['tagger', 'tags', 'emner']);
  const imgCol = findMatch(['bilde', 'image', 'bildestatus', 'illustrasjon']);

  // 6. Content-based fallback if columns are missing or generic (e.g. Column1, Column2, A, B)
  if (!qCol || !aCol || qCol === aCol) {
    const usableCols = columns.filter(
      (c) => c !== idCol && c !== rCol && c !== fullRCol && c !== katCol && c !== tCol && c !== imgCol
    );

    if (usableCols.length >= 2) {
      // Calculate average text length for each column across sample rows
      const colLengths = usableCols.map((col) => {
        let totalLen = 0;
        let count = 0;
        for (let i = 0; i < Math.min(rows.length, 25); i++) {
          const val = String(rows[i]?.[col] || '').trim();
          if (val.length > 0) {
            totalLen += val.length;
            count++;
          }
        }
        return { col, avgLen: count > 0 ? totalLen / count : 0 };
      });

      // Shorter column = Question / Term / Forside (e.g. "Ortostatisk blodtrykksfall")
      // Longer column = Answer / Explanation / Bakside (e.g. "Blodtrykksfall på minst 20 mmHg...")
      colLengths.sort((a, b) => a.avgLen - b.avgLen);

      if (!qCol) qCol = colLengths[0]?.col || usableCols[0];
      if (!aCol || aCol === qCol) aCol = colLengths[1]?.col || usableCols[1] || usableCols[0];
    } else if (usableCols.length === 1) {
      qCol = usableCols[0];
      aCol = usableCols[0];
    } else {
      qCol = columns[0] || 'Spørsmål';
      aCol = columns[1] || columns[0] || 'Svar';
    }
  }

  return {
    idCol,
    qCol,
    aCol,
    rCol,
    fullRCol,
    katCol,
    emneCol,
    typeCol,
    nivaCol,
    docCol,
    secCol,
    dCol,
    statusCol,
    tCol,
    imgCol,
  };
}

// Parse Excel files (.xlsx, .xls, .csv) with full 1:1 fidelity and dynamic row counting
export async function parseExcelFile(file: File): Promise<{
  deckTitle: string;
  cards: ParsedCardDraft[];
  columns: string[];
  rawRows: Record<string, any>[];
  report: ExcelImportReport;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Priority sheet: 'FLASHCARDS', else 'FLASHFORGE_MASTERBANK', else first non-empty sheet
  let targetSheetName = workbook.SheetNames.find((s) => s.toUpperCase() === 'FLASHCARDS');
  if (!targetSheetName) {
    targetSheetName = workbook.SheetNames.find((s) => s.toUpperCase().includes('FLASHFORGE'));
  }
  if (!targetSheetName) {
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      if (sheet && sheet['!ref']) {
        targetSheetName = name;
        break;
      }
    }
  }
  targetSheetName = targetSheetName || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const deckTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  if (!jsonData || jsonData.length === 0) {
    return {
      deckTitle,
      cards: [],
      columns: [],
      rawRows: [],
      report: {
        totalRows: 0,
        imported: 0,
        notImported: 0,
        questionsCount: 0,
        answersCount: 0,
        referencesCount: 0,
        skippedDetails: [],
      },
    };
  }

  const columns = Object.keys(jsonData[0] || {});
  const identified = identifyColumns(columns, jsonData);

  const skippedDetails: Array<{ row: number; reason: string }> = [];
  let questionsCount = 0;
  let answersCount = 0;
  let referencesCount = 0;

  // Process EVERY single row in the file dynamically without any fixed count or cut-offs
  const cards: ParsedCardDraft[] = jsonData.map((row, index) => {
    const rawId = identified.idCol ? row[identified.idCol] : `FF-${String(index + 1).padStart(4, '0')}`;
    let rawQ = identified.qCol ? row[identified.qCol] : `Kort ${index + 1}`;
    let rawA = identified.aCol ? row[identified.aCol] : '';
    const rawR = identified.rCol ? row[identified.rCol] : '';
    const rawFullR = identified.fullRCol ? row[identified.fullRCol] : rawR;

    const rawKat = identified.katCol ? row[identified.katCol] : 'Generell';
    const rawEmne = identified.emneCol ? row[identified.emneCol] : rawKat;
    const rawType = identified.typeCol ? row[identified.typeCol] : 'Definisjon';
    const rawNiva = identified.nivaCol ? row[identified.nivaCol] : 'Grunnleggende';
    const rawDoc = identified.docCol ? row[identified.docCol] : file.name;
    const rawSec = identified.secCol ? row[identified.secCol] : '';
    const rawDesign = identified.dCol ? row[identified.dCol] : '';
    const rawStatus = identified.statusCol ? row[identified.statusCol] : 'KLAR';

    const rawTags = identified.tCol && row[identified.tCol]
      ? String(row[identified.tCol]).split(/[,;]/).map((t) => t.trim())
      : [rawKat, rawEmne];
    const rawImg = identified.imgCol ? String(row[identified.imgCol]).trim() : '';

    let question = sanitizeInput(rawQ);
    let answer = sanitizeInput(rawA);

    // If Question and Answer ended up in the same cell (e.g. "Ortostatisk blodtrykksfall: Blodtrykksfall på minst..." or with newlines)
    if (question && (!answer || question === answer)) {
      if (question.includes('\n')) {
        const parts = question.split('\n').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          question = parts[0];
          answer = parts.slice(1).join('\n');
        }
      }
      const colonMatch = question.indexOf(':');
      const dashMatch = question.indexOf(' - ');
      if ((!answer || answer === question) && colonMatch > 2 && colonMatch < 80) {
        answer = question.slice(colonMatch + 1).trim();
        question = question.slice(0, colonMatch).trim();
      } else if ((!answer || answer === question) && dashMatch > 2 && dashMatch < 80) {
        answer = question.slice(dashMatch + 3).trim();
        question = question.slice(0, dashMatch).trim();
      }
    }

    // Inverted columns check (e.g. if column 1 was definition and column 2 was term)
    if (
      question.length > 180 &&
      answer.length > 0 &&
      answer.length < 65 &&
      !answer.includes('.') &&
      !answer.toLowerCase().startsWith('forklaring')
    ) {
      const temp = question;
      question = answer;
      answer = temp;
    }

    // Format & clean reference to strict APA 7, stripping any 'forside' artifacts
    const cleanedRawRef = cleanReferenceArtifacts(sanitizeInput(rawR));
    const apaFormatted = formatToApa7Reference(cleanedRawRef, String(rawDoc), String(rawSec), String(rawKat));
    const reference = apaFormatted.inText;
    const fullReferanse = cleanReferenceArtifacts(sanitizeInput(rawFullR)) || apaFormatted.fullReference;

    if (question.length > 0) questionsCount++;
    if (answer.length > 0) answersCount++;
    if (reference.length > 0) referencesCount++;

    const design: CardDesignFamily = rawDesign
      ? (rawDesign as CardDesignFamily)
      : detectDesignByTopic(question + ' ' + answer);

    return {
      kortId: String(rawId),
      kategori: String(rawKat),
      emne: String(rawEmne),
      korttype: rawType as any,
      niva: rawNiva as any,
      forside: question,
      bakside: answer,
      referansehenvisning: reference,
      fullReferanse,
      kildedokument: String(rawDoc),
      kildeseksjon: String(rawSec),
      design,
      status: (rawStatus as any) || 'KLAR',
      referanseKobling: 'DIREKTE',
      tagger: rawTags.filter(Boolean),
      question,
      answer,
      reference,
      tags: rawTags.filter(Boolean),
      imageUrl: rawImg.startsWith('http') || rawImg.startsWith('data:') ? rawImg : undefined,
      selected: true,
    };
  });

  const report: ExcelImportReport = {
    totalRows: jsonData.length,
    imported: cards.length,
    notImported: skippedDetails.length,
    questionsCount,
    answersCount,
    referencesCount,
    skippedDetails,
  };

  return { deckTitle, cards, columns, rawRows: jsonData, report };
}

// Extract text from Word (.docx) files
export async function parseWordFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawStr = textDecoder.decode(arrayBuffer);

    const matches = rawStr.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g);
    if (matches && matches.length > 0) {
      return matches
        .map((m) => m.replace(/<[^>]+>/g, ''))
        .filter((t) => t.trim().length > 0)
        .join(' ');
    }

    const cleanFallback = rawStr.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\xC0-\xFF]/g, ' ');
    return cleanFallback;
  } catch (e) {
    console.error('Error parsing Word document:', e);
    return '';
  }
}

// Extract text from PDF files
export async function parsePdfFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawStr = textDecoder.decode(arrayBuffer);

    const textChunks: string[] = [];
    const streamMatches = rawStr.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);

    if (streamMatches) {
      for (const stream of streamMatches) {
        const textParts = stream.match(/\(([^)]+)\)\s*Tj/g);
        if (textParts) {
          textChunks.push(textParts.map((p) => p.replace(/[()Tj\s]/g, '')).join(' '));
        }
      }
    }

    if (textChunks.length > 0) {
      return textChunks.join('\n');
    }

    return rawStr
      .replace(/[^\x20-\x7E\xC0-\xFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    console.error('Error parsing PDF:', e);
    return '';
  }
}

// Parse delimited text (CSV, TSV, Anki, Quizlet exports)
export function parseDelimitedText(text: string): ParsedCardDraft[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const drafts: ParsedCardDraft[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#')) continue;

    let parts = line.split('\t');
    if (parts.length < 2) parts = line.split(';');
    if (parts.length < 2) parts = line.split(',');

    if (parts.length >= 2) {
      let question = sanitizeInput(parts[0]);
      let answer = sanitizeInput(parts[1]);
      let rawRef = '';

      const refMatch = answer.match(/\[Kilde:\s*([^\]]+)\]/i);
      if (refMatch) {
        rawRef = refMatch[1].trim();
        answer = answer.replace(refMatch[0], '').trim();
      }

      if (parts.length >= 3 && parts[2].trim().length > 0) {
        rawRef = sanitizeInput(parts[2]);
      }

      const apaFormatted = formatToApa7Reference(rawRef, 'Tekstkilde', `Rad ${i + 1}`);

      drafts.push({
        kortId: `FF-${String(i + 1).padStart(4, '0')}`,
        question,
        answer,
        reference: apaFormatted.inText,
        forside: question,
        bakside: answer,
        referansehenvisning: apaFormatted.inText,
        fullReferanse: apaFormatted.fullReference,
        kategori: 'Importert',
        emne: 'Fag',
        korttype: 'Definisjon',
        niva: 'Grunnleggende',
        design: detectDesignByTopic(question + ' ' + answer),
        status: 'KLAR',
        referanseKobling: 'DIREKTE',
        tagger: ['Importert'],
        tags: ['Importert'],
        selected: true,
      });
    }
  }

  return drafts;
}

// Local heuristic card extraction for unstructured texts (Word, PDF)
export function extractCardsFromRawTextLocally(
  rawText: string,
  fileName: string = 'Dokument'
): ParsedCardDraft[] {
  const paragraphs = rawText
    .split(/\n{2,}|\.\s{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 10);

  const drafts: ParsedCardDraft[] = [];

  paragraphs.forEach((p, index) => {
    let q = '';
    let a = '';

    const questionMarkIdx = p.indexOf('?');
    const colonIdx = p.indexOf(':');
    const dashIdx = p.indexOf(' - ');

    if (questionMarkIdx !== -1 && questionMarkIdx < p.length - 10) {
      q = p.slice(0, questionMarkIdx + 1).trim();
      a = p.slice(questionMarkIdx + 1).trim();
    } else if (colonIdx !== -1 && colonIdx < 60) {
      q = p.slice(0, colonIdx).trim();
      a = p.slice(colonIdx + 1).trim();
    } else if (dashIdx !== -1 && dashIdx < 60) {
      q = p.slice(0, dashIdx).trim();
      a = p.slice(dashIdx + 3).trim();
    } else {
      const firstDot = p.indexOf('.');
      if (firstDot > 10 && firstDot < 80) {
        q = p.slice(0, firstDot).trim();
        a = p.slice(firstDot + 1).trim() || p;
      } else {
        q = p.slice(0, 50).trim();
        a = p;
      }
    }

    if (q && a) {
      const cleanDoc = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const apaRef = formatToApa7Reference('', cleanDoc, `avsnitt ${index + 1}`);

      drafts.push({
        kortId: `FF-${String(index + 1).padStart(4, '0')}`,
        question: sanitizeInput(q),
        answer: sanitizeInput(a),
        reference: apaRef.inText,
        forside: sanitizeInput(q),
        bakside: sanitizeInput(a),
        referansehenvisning: apaRef.inText,
        fullReferanse: apaRef.fullReference,
        kategori: 'Dokumentanalyse',
        emne: 'Pensum',
        korttype: 'Definisjon',
        niva: 'Grunnleggende',
        design: detectDesignByTopic(q + ' ' + a),
        status: 'KLAR',
        referanseKobling: 'DIREKTE',
        tagger: ['Dokument'],
        tags: ['Dokument'],
        selected: true,
      });
    }
  });

  return drafts;
}
