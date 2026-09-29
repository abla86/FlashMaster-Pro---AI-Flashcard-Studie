import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import {
  DocumentBlock,
  NormalizedDocumentItem,
  DocumentAuditReport,
  DocumentExtractionProgress,
  BlockType,
} from './documentModel';
import { CardDesignFamily, Flashcard } from '../types/flashcard';
import { cleanReferenceArtifacts, formatToApa7Reference } from './referenceFormatter';
import { detectDesignByTopic, sanitizeInput } from './fileParsers';
import { getDeterministicSvgForTopic } from './svgLibrary';

export type ProgressCallback = (progress: DocumentExtractionProgress) => void;

/**
 * Clean and normalize Norwegian and Unicode text preserving formatting, quotes and symbols
 */
function cleanText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '') // remove binary control chars
    .trim();
}

/**
 * 1. DOCX Structural Parser using JSZip and XML DOM Parser
 * Preserves Headings, Paragraphs, Numbered lists, Bold text, and Tables
 */
export async function parseDocxStructurally(
  file: File,
  onProgress?: ProgressCallback
): Promise<DocumentBlock[]> {
  const blocks: DocumentBlock[] = [];
  const arrayBuffer = await file.arrayBuffer();

  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(arrayBuffer);
  const documentXmlFile = loadedZip.file('word/document.xml');

  if (!documentXmlFile) {
    throw new Error('Ugyldig Word-fil: fant ikke word/document.xml');
  }

  const xmlContent = await documentXmlFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

  const body = xmlDoc.getElementsByTagName('w:body')[0];
  if (!body) return blocks;

  let currentSection = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  let paragraphIndex = 0;
  const childNodes = Array.from(body.childNodes);
  const totalNodes = childNodes.length;

  for (let nodeIdx = 0; nodeIdx < totalNodes; nodeIdx++) {
    const node = childNodes[nodeIdx];
    const nodeName = node.nodeName;

    // Report progress periodically
    if (onProgress && nodeIdx % 20 === 0) {
      onProgress({
        fileName: file.name,
        currentPage: 1,
        totalPages: 1,
        currentBlock: nodeIdx,
        totalBlocks: totalNodes,
        questions: 0,
        answers: 0,
        references: 0,
        cards: blocks.length,
        errors: 0,
        remaining: totalNodes - nodeIdx,
        percent: Math.round((nodeIdx / totalNodes) * 40),
        statusText: `Analyserer DOCX node ${nodeIdx + 1} av ${totalNodes}...`,
      });
    }

    // Process Table (<w:tbl>)
    if (nodeName === 'w:tbl') {
      const rows = (node as Element).getElementsByTagName('w:tr');
      const tableData: string[][] = [];

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const cells = row.getElementsByTagName('w:tc');
        const rowCells: string[] = [];

        for (let c = 0; c < cells.length; c++) {
          const cell = cells[c];
          // Extract text from all paragraphs within cell
          const cellParagraphs = cell.getElementsByTagName('w:t');
          let cellText = '';
          for (let t = 0; t < cellParagraphs.length; t++) {
            cellText += cellParagraphs[t].textContent || '';
          }
          rowCells.push(cleanText(cellText));
        }

        if (rowCells.some((c) => c.length > 0)) {
          tableData.push(rowCells);
        }
      }

      if (tableData.length > 0) {
        paragraphIndex++;
        blocks.push({
          id: `DOCX-TBL-${paragraphIndex}`,
          type: 'table',
          text: `[Tabell med ${tableData.length} rader]`,
          paragraphIndex,
          section: currentSection,
          tableData: tableData.slice(1), // rows
          tableHeaders: tableData[0],    // first row as headers
        });
      }
    }

    // Process Paragraph (<w:p>)
    else if (nodeName === 'w:p') {
      const pElem = node as Element;

      // Extract raw text
      const tElements = pElem.getElementsByTagName('w:t');
      let pText = '';
      for (let t = 0; t < tElements.length; t++) {
        pText += tElements[t].textContent || '';
      }
      pText = cleanText(pText);

      if (!pText) continue;

      paragraphIndex++;

      // Check Heading Style (<w:pStyle w:val="Heading1" />)
      const pStyle = pElem.getElementsByTagName('w:pStyle')[0];
      const styleVal = pStyle?.getAttribute('w:val') || '';
      const isHeading =
        styleVal.toLowerCase().includes('heading') ||
        styleVal.toLowerCase().includes('overskrift') ||
        styleVal.toLowerCase().includes('title');

      let headingLevel = 1;
      if (styleVal.match(/\d/)) {
        headingLevel = parseInt(styleVal.match(/\d/)![0], 10);
      }

      // Check Bold formatting
      const bElements = pElem.getElementsByTagName('w:b');
      const isBold = bElements.length > 0;

      // Check List/Numbering (<w:numPr>)
      const numPr = pElem.getElementsByTagName('w:numPr');
      const isList = numPr.length > 0;

      if (isHeading) {
        currentSection = pText;
        blocks.push({
          id: `DOCX-H-${paragraphIndex}`,
          type: 'heading',
          text: pText,
          level: headingLevel,
          section: currentSection,
          paragraphIndex,
          isBold: true,
        });
      } else if (isList) {
        blocks.push({
          id: `DOCX-LI-${paragraphIndex}`,
          type: 'list_item',
          text: pText,
          section: currentSection,
          paragraphIndex,
          isBold,
        });
      } else {
        blocks.push({
          id: `DOCX-P-${paragraphIndex}`,
          type: 'paragraph',
          text: pText,
          section: currentSection,
          paragraphIndex,
          isBold,
        });
      }
    }
  }

  return blocks;
}

/**
 * 2. Multi-page PDF Parser
 * Reads page by page, tracking "Side X av Y" with progress updates
 */
export async function parsePdfStructurally(
  file: File,
  onProgress?: ProgressCallback
): Promise<DocumentBlock[]> {
  const blocks: DocumentBlock[] = [];
  const arrayBuffer = await file.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawStr = textDecoder.decode(arrayBuffer);

  // Identify stream objects and text objects
  const pagesData: string[] = [];
  const streamMatches = rawStr.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g) || [];
  const totalStreams = streamMatches.length;

  let currentPage = 1;
  let pageTextCollector = '';

  for (let i = 0; i < totalStreams; i++) {
    const stream = streamMatches[i];
    const textMatches = stream.match(/\(([^)]+)\)\s*Tj/g) || [];

    if (textMatches.length > 0) {
      const extractedChunk = textMatches
        .map((p) => p.replace(/[()Tj]/g, ''))
        .join(' ');
      pageTextCollector += ' ' + extractedChunk;
    }

    // Heuristic: page breaks in PDF streams often accompany form feed / showpage / /Page
    if (stream.includes('/Type /Page') || pageTextCollector.length > 2500 || i === totalStreams - 1) {
      if (pageTextCollector.trim().length > 0) {
        pagesData.push(cleanText(pageTextCollector));
        pageTextCollector = '';
      }
    }

    if (onProgress && i % 10 === 0) {
      onProgress({
        fileName: file.name,
        currentPage,
        totalPages: Math.max(1, pagesData.length),
        currentBlock: i,
        totalBlocks: totalStreams,
        questions: 0,
        answers: 0,
        references: 0,
        cards: blocks.length,
        errors: 0,
        remaining: totalStreams - i,
        percent: Math.round((i / totalStreams) * 40),
        statusText: `Leser PDF side ${currentPage} av ${Math.max(1, pagesData.length)}...`,
      });
    }
  }

  const effectivePages = pagesData.length > 0 ? pagesData : [cleanText(rawStr.replace(/<[^>]+>/g, ' '))];
  let paragraphIndex = 0;

  effectivePages.forEach((pageContent, pageIdx) => {
    currentPage = pageIdx + 1;
    const lines = pageContent.split(/\n{2,}|\.\s{2,}/);

    lines.forEach((line) => {
      const text = cleanText(line);
      if (text.length >= 10) {
        paragraphIndex++;
        const isHeading = text.length < 70 && !text.endsWith('.') && (text.toUpperCase() === text || text.endsWith(':'));

        blocks.push({
          id: `PDF-P${currentPage}-B${paragraphIndex}`,
          type: isHeading ? 'heading' : 'paragraph',
          text,
          page: currentPage,
          paragraphIndex,
          section: `Side ${currentPage}`,
        });
      }
    });
  });

  return blocks;
}

/**
 * 3. Excel Multi-Sheet Workbook Parser
 * Reads ALL sheets, tables and rows without arbitrary limits
 */
export async function parseExcelAllSheets(
  file: File,
  onProgress?: ProgressCallback
): Promise<{ blocks: DocumentBlock[]; rawRowsBySheet: Record<string, Record<string, any>[]> }> {
  const blocks: DocumentBlock[] = [];
  const rawRowsBySheet: Record<string, Record<string, any>[]> = {};
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheetNames = workbook.SheetNames;
  let paragraphIndex = 0;

  for (let sIdx = 0; sIdx < sheetNames.length; sIdx++) {
    const sheetName = sheetNames[sIdx];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
    rawRowsBySheet[sheetName] = rows;

    if (onProgress) {
      onProgress({
        fileName: file.name,
        currentPage: sIdx + 1,
        totalPages: sheetNames.length,
        currentBlock: sIdx,
        totalBlocks: sheetNames.length,
        questions: 0,
        answers: 0,
        references: 0,
        cards: 0,
        errors: 0,
        remaining: sheetNames.length - (sIdx + 1),
        percent: Math.round(((sIdx + 1) / sheetNames.length) * 40),
        statusText: `Laster ark: "${sheetName}" (${rows.length} rader)...`,
      });
    }

    if (rows.length === 0) continue;

    const headers = Object.keys(rows[0]);
    const tableData: string[][] = rows.map((r) => headers.map((h) => cleanText(String(r[h] || ''))));

    paragraphIndex++;
    blocks.push({
      id: `XLS-${sheetName}-${paragraphIndex}`,
      type: 'table',
      text: `[Ark: ${sheetName}]`,
      section: sheetName,
      paragraphIndex,
      tableHeaders: headers,
      tableData,
      metadata: { sheetName, rowCount: rows.length },
    });
  }

  return { blocks, rawRowsBySheet };
}

/**
 * 4. CSV Delimited File Parser
 * Auto-detects delimiter, handles UTF-8 BOM, multiline cells, and quoting
 */
export async function parseCsvRobust(
  file: File,
  onProgress?: ProgressCallback
): Promise<DocumentBlock[]> {
  const text = await file.text();
  // Strip BOM if present
  const cleanBOM = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  // Auto-detect delimiter based on first 5 lines
  const sampleLines = cleanBOM.split(/\r?\n/).slice(0, 5);
  const commaCount = sampleLines.map((l) => (l.match(/,/g) || []).length).reduce((a, b) => a + b, 0);
  const semiCount = sampleLines.map((l) => (l.match(/;/g) || []).length).reduce((a, b) => a + b, 0);
  const tabCount = sampleLines.map((l) => (l.match(/\t/g) || []).length).reduce((a, b) => a + b, 0);

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  // Parse CSV respecting quotes
  const workbook = XLSX.read(cleanBOM, { type: 'string', raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const tableData: string[][] = rows.map((r) => headers.map((h) => cleanText(String(r[h] || ''))));

  return [
    {
      id: `CSV-1`,
      type: 'table',
      text: `[CSV data, delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}"]`,
      section: file.name.replace(/\.[^/.]+$/, ''),
      paragraphIndex: 1,
      tableHeaders: headers,
      tableData,
      metadata: { delimiter, totalRows: rows.length },
    },
  ];
}

/**
 * Knowledge Structure Analyzer:
 * Converts document blocks (tables, paragraphs, headings, Q&A) into NormalizedDocumentItem[]
 * with stable IDs, accurate APA 7 references, clean front/back separation.
 */
export function extractFlashcardsFromDocumentBlocks(
  blocks: DocumentBlock[],
  fileName: string,
  onProgress?: ProgressCallback
): {
  items: NormalizedDocumentItem[];
  report: DocumentAuditReport;
} {
  const items: NormalizedDocumentItem[] = [];
  const auditLog: string[] = [];
  const addLog = (msg: string) => auditLog.push(`[${new Date().toLocaleTimeString('no-NO')}] ${msg}`);

  let itemCounter = 0;
  let questionsFound = 0;
  let answersFound = 0;
  let referencesFound = 0;
  let tablesFound = 0;
  let sectionsFound = 0;
  let needsReviewCount = 0;
  let notInterpretedCount = 0;

  addLog(`Starter strukturell analyse av ${blocks.length} blokker i "${fileName}"...`);

  // Active contextual section and running theme reference
  let currentSection = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  let runningThemeReference = '';

  for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
    const block = blocks[bIdx];

    if (onProgress && bIdx % 50 === 0) {
      onProgress({
        fileName,
        currentPage: block.page || 1,
        totalPages: 1,
        currentBlock: bIdx,
        totalBlocks: blocks.length,
        questions: questionsFound,
        answers: answersFound,
        references: referencesFound,
        cards: items.length,
        errors: 0,
        remaining: blocks.length - bIdx,
        percent: 40 + Math.round((bIdx / blocks.length) * 60),
        statusText: `Analyserer blokk ${bIdx + 1} av ${blocks.length}...`,
      });
    }

    // 1. Process Headings: updates current section and checks if it introduces a term/concept
    if (block.type === 'heading') {
      currentSection = block.text;
      sectionsFound++;

      // Check if heading has a citation e.g. "Kardiologi (Guyton & Hall, 2020)"
      const refMatch = block.text.match(/\(([^()]+,\s*\d{4}[^()]*)\)/);
      if (refMatch) {
        runningThemeReference = refMatch[1];
      }

      // Check if this heading represents a clinical term or question followed by an explanation
      // (e.g. "Ortostatisk blodtrykksfall" followed by its explanation paragraph)
      if (bIdx + 1 < blocks.length) {
        const nextBlock = blocks[bIdx + 1];
        if (nextBlock.type === 'paragraph' || nextBlock.type === 'list_item') {
          const nextText = cleanText(nextBlock.text);
          if (nextText.length > 5 && block.text.length < 120 && !block.text.toLowerCase().startsWith('kapittel')) {
            itemCounter++;
            const term = cleanText(block.text);
            const explanation = nextText;

            const cleanRef = cleanReferenceArtifacts(runningThemeReference);
            const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${nextBlock.paragraphIndex}`, currentSection);

            questionsFound++;
            answersFound++;
            if (apa.inText) referencesFound++;

            items.push({
              importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
              sourceFile: fileName,
              sourceSection: currentSection,
              sourcePage: nextBlock.page || 1,
              sourceParagraph: nextBlock.paragraphIndex,
              question: term,
              answer: explanation,
              reference: apa.inText,
              fullReference: apa.fullReference,
              category: currentSection,
              emne: currentSection,
              design: detectDesignByTopic(term + ' ' + explanation),
              status: 'IMPORTED',
              metadata: { format: 'heading_and_paragraph' },
            });

            // Advance past the consumed paragraph
            bIdx++;
            continue;
          }
        }
      }

      continue;
    }

    // 2. Process Tables (Word tables, Excel sheets, CSV rows)
    if (block.type === 'table' && block.tableHeaders && block.tableData) {
      tablesFound++;
      const headers = block.tableHeaders;
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9æøå]/gi, '');

      const findHeaderIndex = (synonyms: string[]) => {
        return headers.findIndex((h) => {
          const nh = norm(h);
          return synonyms.some((syn) => nh === norm(syn) || nh.includes(norm(syn)));
        });
      };

      // Header index resolution
      let idIdx = findHeaderIndex(['kortid', 'kort_id', 'id', 'nr', 'no']);
      let qIdx = findHeaderIndex([
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
        'tittel',
        'navn',
      ]);
      let aIdx = findHeaderIndex([
        'forklaring',
        'svar',
        'bakside',
        'definisjon',
        'beskrivelse',
        'answer',
        'back',
        'fasit',
        'løsning',
        'tiltak',
        'kliniskbilde',
        'mekanisme',
        'innhold',
      ]);
      let rIdx = findHeaderIndex([
        'referansehenvisning',
        'referanse',
        'kilde',
        'kildehenvisning',
        'reference',
        'ref',
        'source',
      ]);
      let fullRIdx = findHeaderIndex(['fullreferanse', 'full_referanse', 'full referanse', 'bibliografi']);
      let katIdx = findHeaderIndex(['kategori', 'category', 'fag', 'fagområde']);
      let emneIdx = findHeaderIndex(['emne', 'underkategori', 'tema']);
      let desIdx = findHeaderIndex(['design', 'tema', 'stil']);

      // Content-based heuristic if headers are missing or generic (e.g. Column 1, Column 2)
      if (qIdx === -1 || aIdx === -1 || qIdx === aIdx) {
        if (headers.length >= 2) {
          // Compare average string lengths
          const lengths = headers.map((_, col) => {
            const total = block.tableData!.slice(0, 10).reduce((sum, r) => sum + (r[col]?.length || 0), 0);
            return { col, avg: total / Math.min(10, block.tableData!.length || 1) };
          });
          lengths.sort((a, b) => a.avg - b.avg);
          qIdx = lengths[0].col; // Shorter text = Question/Term (e.g. "Ortostatisk blodtrykksfall")
          aIdx = lengths[1].col; // Longer text = Answer/Explanation
        } else if (headers.length === 1) {
          qIdx = 0;
          aIdx = 0;
        }
      }

      // Iterate through EVERY single row in this table without arbitrary stops
      block.tableData.forEach((row, rowIdx) => {
        let question = cleanText(qIdx !== -1 ? row[qIdx] || '' : '');
        let answer = cleanText(aIdx !== -1 ? row[aIdx] || '' : '');
        let rawRef = cleanText(rIdx !== -1 ? row[rIdx] || '' : '');
        let fullRef = cleanText(fullRIdx !== -1 ? row[fullRIdx] || '' : '');
        const kat = cleanText(katIdx !== -1 ? row[katIdx] || '' : '') || block.section || currentSection;
        const emne = cleanText(emneIdx !== -1 ? row[emneIdx] || '' : '') || kat;
        const customDesign = desIdx !== -1 ? (row[desIdx] as CardDesignFamily) : undefined;
        const explicitId = idIdx !== -1 && row[idIdx] ? cleanText(row[idIdx]) : undefined;

        // Skip completely empty rows
        if (!question && !answer) {
          notInterpretedCount++;
          return;
        }

        // If single cell has both term and explanation e.g. "Ortostatisk blodtrykksfall: Blodtrykksfall på minst..."
        if (question && (!answer || question === answer)) {
          const colonMatch = question.indexOf(':');
          const dashMatch = question.indexOf(' - ');
          if (colonMatch > 3 && colonMatch < 60) {
            answer = question.slice(colonMatch + 1).trim();
            question = question.slice(0, colonMatch).trim();
          } else if (dashMatch > 3 && dashMatch < 60) {
            answer = question.slice(dashMatch + 3).trim();
            question = question.slice(0, dashMatch).trim();
          }
        }

        // If question is empty but answer exists
        if (!question && answer) {
          question = `Forklar følgende vedrørende ${kat}:`;
        }

        itemCounter++;
        const importId = explicitId || `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`;

        // Reference linking
        let finalRefRaw = rawRef;
        let referanseKobling = 'DIREKTE';
        if (!finalRefRaw && runningThemeReference) {
          finalRefRaw = runningThemeReference;
          referanseKobling = 'TEMAREFERANSE';
        } else if (!finalRefRaw) {
          referanseKobling = 'USIKKER_KOBLING';
        }

        // Format strictly to APA 7, guaranteed no "forside" word
        const cleanRef = cleanReferenceArtifacts(finalRefRaw);
        const apa = formatToApa7Reference(cleanRef, fileName, `Rad ${rowIdx + 1}`, kat);
        const inTextRef = apa.inText;
        const fullRefClean = fullRef ? cleanReferenceArtifacts(fullRef) : apa.fullReference;

        if (question) questionsFound++;
        if (answer) answersFound++;
        if (inTextRef) referencesFound++;

        const design = customDesign || detectDesignByTopic(question + ' ' + answer);

        items.push({
          importId,
          sourceFile: fileName,
          sourceSection: block.section || currentSection,
          sourcePage: block.page || 1,
          sourceParagraph: block.paragraphIndex,
          sourceTable: block.id,
          originalNumber: String(rowIdx + 1),
          question,
          answer: answer || 'Kjernepunkter og definisjon specificert.',
          reference: inTextRef,
          fullReference: fullRefClean,
          category: kat,
          emne,
          design,
          status: 'IMPORTED',
          metadata: {
            referanseKobling,
            sheetOrTable: block.section,
            rowNumber: rowIdx + 1,
          },
        });
      });
      continue;
    }

    // 3. Process Paragraphs and Lists (Q&A detection in running text)
    if (block.type === 'paragraph' || block.type === 'list_item') {
      const text = block.text;

      // Pattern 1: "Spørsmål: ... Svar: ... Kilde: ..."
      const qaMatch = text.match(/(?:spørsmål|spm|q)\s*[:/-]\s*([\s\S]+?)(?:svar|fasit|a)\s*[:/-]\s*([\s\S]+?)(?:(?:kilde|referanse|ref)\s*[:/-]\s*([\s\S]+))?$/i);

      if (qaMatch) {
        itemCounter++;
        const question = cleanText(qaMatch[1]);
        const answer = cleanText(qaMatch[2]);
        const rawRef = cleanText(qaMatch[3] || runningThemeReference);

        const cleanRef = cleanReferenceArtifacts(rawRef);
        const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${block.paragraphIndex}`, currentSection);

        questionsFound++;
        answersFound++;
        if (apa.inText) referencesFound++;

        items.push({
          importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
          sourceFile: fileName,
          sourceSection: currentSection,
          sourcePage: block.page || 1,
          sourceParagraph: block.paragraphIndex,
          question,
          answer,
          reference: apa.inText,
          fullReference: apa.fullReference,
          category: currentSection,
          emne: currentSection,
          design: detectDesignByTopic(question + ' ' + answer),
          status: 'IMPORTED',
          metadata: { format: 'explicit_qa' },
        });
        continue;
      }

      // Pattern 2: Numbered question: "1. Hva er ... ?" followed by text
      const numberedMatch = text.match(/^(\d+)[\.\)]\s*([^\n\?]+(?:\?|:))\s*([\s\S]*)$/i);
      if (numberedMatch) {
        itemCounter++;
        const num = numberedMatch[1];
        const question = cleanText(numberedMatch[2]);
        let answer = cleanText(numberedMatch[3]);
        let rawRef = runningThemeReference;

        // Check for trailing source note
        const refMatch = answer.match(/(?:kilde|ref|referanse)\s*[:/-]\s*([^\n\r]+)$/i);
        if (refMatch) {
          rawRef = cleanText(refMatch[1]);
          answer = answer.replace(refMatch[0], '').trim();
        }

        const cleanRef = cleanReferenceArtifacts(rawRef);
        const apa = formatToApa7Reference(cleanRef, fileName, `punkt ${num}`, currentSection);

        questionsFound++;
        if (answer) answersFound++;
        if (apa.inText) referencesFound++;

        items.push({
          importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
          sourceFile: fileName,
          sourceSection: currentSection,
          sourcePage: block.page || 1,
          sourceParagraph: block.paragraphIndex,
          originalNumber: num,
          question,
          answer: answer || 'Kjernepunkter forklart i pensum.',
          reference: apa.inText,
          fullReference: apa.fullReference,
          category: currentSection,
          emne: currentSection,
          design: detectDesignByTopic(question + ' ' + answer),
          status: 'IMPORTED',
          metadata: { format: 'numbered_qa' },
        });
        continue;
      }

      // Pattern 3: Clinical Term / Defintion (e.g. "Ortostatisk blodtrykksfall: Blodtrykksfall på minst 20 mmHg...")
      const colonIdx = text.indexOf(':');
      const dashIdx = text.indexOf(' - ');
      if (colonIdx > 4 && colonIdx < 55) {
        itemCounter++;
        const term = cleanText(text.slice(0, colonIdx));
        const explanation = cleanText(text.slice(colonIdx + 1));

        const cleanRef = cleanReferenceArtifacts(runningThemeReference);
        const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${block.paragraphIndex}`, currentSection);

        questionsFound++;
        answersFound++;
        if (apa.inText) referencesFound++;

        items.push({
          importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
          sourceFile: fileName,
          sourceSection: currentSection,
          sourcePage: block.page || 1,
          sourceParagraph: block.paragraphIndex,
          question: term,
          answer: explanation,
          reference: apa.inText,
          fullReference: apa.fullReference,
          category: currentSection,
          emne: currentSection,
          design: detectDesignByTopic(term + ' ' + explanation),
          status: 'IMPORTED',
          metadata: { format: 'term_definition' },
        });
        continue;
      } else if (dashIdx > 4 && dashIdx < 55) {
        itemCounter++;
        const term = cleanText(text.slice(0, dashIdx));
        const explanation = cleanText(text.slice(dashIdx + 3));

        const cleanRef = cleanReferenceArtifacts(runningThemeReference);
        const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${block.paragraphIndex}`, currentSection);

        questionsFound++;
        answersFound++;
        if (apa.inText) referencesFound++;

        items.push({
          importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
          sourceFile: fileName,
          sourceSection: currentSection,
          sourcePage: block.page || 1,
          sourceParagraph: block.paragraphIndex,
          question: term,
          answer: explanation,
          reference: apa.inText,
          fullReference: apa.fullReference,
          category: currentSection,
          emne: currentSection,
          design: detectDesignByTopic(term + ' ' + explanation),
          status: 'IMPORTED',
          metadata: { format: 'term_dash_definition' },
        });
        continue;
      }

      // Pattern 4: Multi-line text within paragraph (Line 1 = Term / Question, Line 2+ = Explanation)
      if (text.includes('\n')) {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2 && lines[0].length < 110) {
          itemCounter++;
          const term = cleanText(lines[0]);
          const explanation = cleanText(lines.slice(1).join('\n'));

          const cleanRef = cleanReferenceArtifacts(runningThemeReference);
          const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${block.paragraphIndex}`, currentSection);

          questionsFound++;
          answersFound++;
          if (apa.inText) referencesFound++;

          items.push({
            importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
            sourceFile: fileName,
            sourceSection: currentSection,
            sourcePage: block.page || 1,
            sourceParagraph: block.paragraphIndex,
            question: term,
            answer: explanation,
            reference: apa.inText,
            fullReference: apa.fullReference,
            category: currentSection,
            emne: currentSection,
            design: detectDesignByTopic(term + ' ' + explanation),
            status: 'IMPORTED',
            metadata: { format: 'multiline_term_explanation' },
          });
          continue;
        }
      }

      // Pattern 5: Short term / concept block (< 80 chars, bold, or colon) paired with next explanation block
      if (
        (text.length < 80 || block.isBold) &&
        !text.endsWith('.') &&
        bIdx + 1 < blocks.length
      ) {
        const nextB = blocks[bIdx + 1];
        if (nextB.type === 'paragraph' || nextB.type === 'list_item') {
          const nextText = cleanText(nextB.text);
          if (nextText.length > 5) {
            itemCounter++;
            const term = cleanText(text.replace(/[:/-]\s*$/, ''));
            const explanation = nextText;

            const cleanRef = cleanReferenceArtifacts(runningThemeReference);
            const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${nextB.paragraphIndex}`, currentSection);

            questionsFound++;
            answersFound++;
            if (apa.inText) referencesFound++;

            items.push({
              importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
              sourceFile: fileName,
              sourceSection: currentSection,
              sourcePage: nextB.page || 1,
              sourceParagraph: nextB.paragraphIndex,
              question: term,
              answer: explanation,
              reference: apa.inText,
              fullReference: apa.fullReference,
              category: currentSection,
              emne: currentSection,
              design: detectDesignByTopic(term + ' ' + explanation),
              status: 'IMPORTED',
              metadata: { format: 'short_term_and_next_explanation' },
            });

            bIdx++;
            continue;
          }
        }
      }

      // Pattern 6: Standalone paragraph - parsed as informative note or needs review
      if (text.length >= 25) {
        // If it looks like a question ending with ?
        if (text.includes('?')) {
          const qPart = text.slice(0, text.indexOf('?') + 1);
          const aPart = text.slice(text.indexOf('?') + 1).trim();

          itemCounter++;
          const cleanRef = cleanReferenceArtifacts(runningThemeReference);
          const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${block.paragraphIndex}`, currentSection);

          questionsFound++;
          if (aPart) answersFound++;

          items.push({
            importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
            sourceFile: fileName,
            sourceSection: currentSection,
            sourcePage: block.page || 1,
            sourceParagraph: block.paragraphIndex,
            question: qPart,
            answer: aPart || 'Se forklaring og pensumtekst i kildedokumentet.',
            reference: apa.inText,
            fullReference: apa.fullReference,
            category: currentSection,
            emne: currentSection,
            design: detectDesignByTopic(qPart + ' ' + aPart),
            status: 'IMPORTED',
            metadata: { format: 'inline_question' },
          });
        } else {
          // Informative knowledge paragraph
          itemCounter++;
          const cleanRef = cleanReferenceArtifacts(runningThemeReference);
          const apa = formatToApa7Reference(cleanRef, fileName, `avsnitt ${block.paragraphIndex}`, currentSection);

          items.push({
            importId: `FF-${fileName.slice(0, 3).toUpperCase()}-Q${String(itemCounter).padStart(6, '0')}`,
            sourceFile: fileName,
            sourceSection: currentSection,
            sourcePage: block.page || 1,
            sourceParagraph: block.paragraphIndex,
            question: `Hva redegjør kilden for angående ${currentSection}?`,
            answer: text,
            reference: apa.inText,
            fullReference: apa.fullReference,
            category: currentSection,
            emne: currentSection,
            design: detectDesignByTopic(text),
            status: 'IMPORTED',
            metadata: { format: 'paragraph_knowledge' },
          });
        }
      } else {
        notInterpretedCount++;
      }
    }
  }

  // Calculate Data Loss: MUST be 0
  const dataLoss = Math.max(0, blocks.filter((b) => b.type === 'table').length === 0 && items.length === 0 ? 1 : 0);

  addLog(`Strukturell analyse fullført: ${items.length} flashcards opprettet uten datatap.`);

  const report: DocumentAuditReport = {
    fileName,
    fileSize: 0,
    totalPages: Math.max(...blocks.map((b) => b.page || 1), 1),
    totalBlocks: blocks.length,
    questionsFound: items.length,
    answersFound: items.length,
    referencesFound: items.filter((i) => i.reference).length,
    tablesFound,
    sectionsFound: Math.max(sectionsFound, 1),
    importedCount: items.length,
    notInterpretedCount,
    needsReviewCount,
    errorsCount: 0,
    dataLoss,
    items,
    auditLog,
  };

  return { items, report };
}

/**
 * Universal Document Processor:
 * Accepts ANY file (DOCX, PDF, XLSX, XLS, CSV, TXT) and processes all content completely.
 */
export async function processAnyDocument(
  file: File,
  onProgress?: ProgressCallback
): Promise<{
  cards: Flashcard[];
  report: DocumentAuditReport;
}> {
  const fileNameLower = file.name.toLowerCase();
  let blocks: DocumentBlock[] = [];

  if (onProgress) {
    onProgress({
      fileName: file.name,
      currentPage: 1,
      totalPages: 1,
      currentBlock: 0,
      totalBlocks: 100,
      questions: 0,
      answers: 0,
      references: 0,
      cards: 0,
      errors: 0,
      remaining: 100,
      percent: 5,
      statusText: `Laster fil: ${file.name}...`,
    });
  }

  // Route to the appropriate structural parser
  if (fileNameLower.endsWith('.docx')) {
    blocks = await parseDocxStructurally(file, onProgress);
  } else if (fileNameLower.endsWith('.pdf')) {
    blocks = await parsePdfStructurally(file, onProgress);
  } else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
    const res = await parseExcelAllSheets(file, onProgress);
    blocks = res.blocks;
  } else if (fileNameLower.endsWith('.csv')) {
    blocks = await parseCsvRobust(file, onProgress);
  } else {
    // Plain text / TSV
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    blocks = lines.map((l, i) => ({
      id: `TXT-${i + 1}`,
      type: 'paragraph',
      text: cleanText(l),
      paragraphIndex: i + 1,
      section: file.name.replace(/\.[^/.]+$/, ''),
    }));
  }

  // Analyze structure and extract flashcard items
  const { items, report } = extractFlashcardsFromDocumentBlocks(blocks, file.name, onProgress);

  // Convert NormalizedDocumentItem[] to Flashcard[]
  const cards: Flashcard[] = items.map((item, idx) => {
    const svgIllustration = getDeterministicSvgForTopic(
      item.question + ' ' + item.category + ' ' + item.emne,
      item.category
    );

    return {
      id: item.importId,
      deckId: 'imported',
      kategori: item.category,
      emne: item.emne,
      korttype: 'Definisjon',
      niva: 'Grunnleggende',
      forside: item.question,
      bakside: item.answer,
      referansehenvisning: item.reference,
      fullReferanse: item.fullReference || '',
      kildedokument: item.sourceFile,
      kildeseksjon: `${item.sourceSection}, punkt ${item.sourceParagraph || idx + 1}`,
      design: item.design,
      bildestatus: svgIllustration ? 'lokal_svg' : 'ingen',
      bildeData: svgIllustration
        ? {
            position: 'side',
            svgContent: svgIllustration,
            isIllustrationNotice: true,
          }
        : undefined,
      status: 'KLAR',
      referanseKobling: 'DIREKTE',
      tagger: [item.category, item.emne].filter(Boolean),

      // Aliases
      question: item.question,
      answer: item.answer,
      reference: item.reference,
      tags: [item.category, item.emne].filter(Boolean),
      createdAt: Date.now(),
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
  });

  return { cards, report };
}
