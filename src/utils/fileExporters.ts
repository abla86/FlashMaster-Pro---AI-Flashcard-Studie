import * as XLSX from 'xlsx';
import { Flashcard, Deck } from '../types/flashcard';
import { cleanReferenceArtifacts, formatToApa7Reference } from './referenceFormatter';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 1. Export Deck to Excel (.xlsx)
export function exportDeckToExcel(deck: Deck, cards: Flashcard[]): void {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

  const excelRows = deckCards.map((card, idx) => {
    const rawRef = cleanReferenceArtifacts(card.referansehenvisning || card.reference || '');
    const apa = formatToApa7Reference(rawRef, card.kildedokument, card.kildeseksjon, card.kategori);

    return {
      'Kort-ID': card.id || `FF-${idx + 1}`,
      'Kategori': card.kategori || 'Fag',
      'Emne': card.emne || deck.title,
      'Korttype': card.korttype || 'Definisjon',
      'Nivå': card.niva || 'Grunnleggende',
      'Forside (Spørsmål/Case)': card.forside || card.question,
      'Bakside (Korrekt Svar)': card.bakside || card.answer,
      'Referansehenvisning (APA 7)': apa.inText,
      'Full Referanse (APA 7)': card.fullReferanse ? cleanReferenceArtifacts(card.fullReferanse) : apa.fullReference,
      'Kildedokument': card.kildedokument || deck.sourceFileName || '',
      'Kildeseksjon': card.kildeseksjon || '',
      'Design': card.design,
      'Status': card.status || 'KLAR',
      'Referansekobling': card.referanseKobling || 'DIREKTE',
      'Emner / Tagger': (card.tagger || card.tags || []).join(', '),
      'Leitner Boks (1-5)': card.srs?.box || 1,
      'Repetisjoner': card.srs?.repetitionCount || 0,
      'Neste Repetisjon': card.srs?.dueDate ? new Date(card.srs.dueDate).toLocaleDateString('no-NO') : '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'FlashForge Kort');

  worksheet['!cols'] = [
    { wch: 14 }, // Kort-ID
    { wch: 18 }, // Kategori
    { wch: 22 }, // Emne
    { wch: 18 }, // Korttype
    { wch: 14 }, // Nivå
    { wch: 44 }, // Forside
    { wch: 56 }, // Bakside
    { wch: 34 }, // Referansehenvisning
    { wch: 42 }, // Full referanse
    { wch: 24 }, // Kildedokument
    { wch: 18 }, // Kildeseksjon
    { wch: 14 }, // Design
    { wch: 12 }, // Status
    { wch: 16 }, // Referansekobling
    { wch: 24 }, // Tagger
    { wch: 16 }, // Boks
    { wch: 14 }, // Repetisjoner
    { wch: 16 }, // Neste
  ];

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(blob, `${safeTitle}_masterbank.xlsx`);
}

// 2. Export Deck to CSV
export function exportDeckToCsv(deck: Deck, cards: Flashcard[]): void {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

  const headers = [
    'Kort-ID',
    'Kategori',
    'Emne',
    'Korttype',
    'Nivå',
    'Forside',
    'Bakside',
    'Referansehenvisning (APA 7)',
    'Full Referanse (APA 7)',
    'Kildedokument',
    'Design',
    'Status',
  ];

  const rows = deckCards.map((c) => {
    const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
    const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);
    const fullRef = c.fullReferanse ? cleanReferenceArtifacts(c.fullReferanse) : apa.fullReference;

    return [
      c.id,
      c.kategori || '',
      c.emne || '',
      c.korttype || '',
      c.niva || '',
      `"${(c.forside || c.question).replace(/"/g, '""')}"`,
      `"${(c.bakside || c.answer).replace(/"/g, '""')}"`,
      `"${apa.inText.replace(/"/g, '""')}"`,
      `"${fullRef.replace(/"/g, '""')}"`,
      `"${(c.kildedokument || '').replace(/"/g, '""')}"`,
      c.design,
      c.status || 'KLAR',
    ];
  });

  const csvContent = '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(blob, `${safeTitle}_kort.csv`);
}

export type PdfPrintMode = 'study_cards' | 'print_cut' | 'compact' | 'full_size' | 'booklet';

// 3. Export Deck to Word (.doc) with structured chapters, TOC and clean APA 7
export function exportDeckToWord(deck: Deck, cards: Flashcard[]): number {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

  // Group by category
  const categoriesMap: Record<string, Flashcard[]> = {};
  deckCards.forEach((c) => {
    const cat = c.kategori || 'Generelt pensum';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(c);
  });

  const categories = Object.keys(categoriesMap).sort();

  // TOC Summary
  const tocHtml = categories
    .map(
      (cat) =>
        `<tr><td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${escapeHtml(cat)}</td><td style="padding: 6px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0284c7; font-weight: bold;">${categoriesMap[cat].length} kort</td></tr>`
    )
    .join('');

  // Sections
  const sectionsHtml = categories
    .map((cat, catIdx) => {
      const catCards = categoriesMap[cat];
      const cardsHtml = catCards
        .map((c, i) => {
          const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
          const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);
          const fullRef = c.fullReferanse ? cleanReferenceArtifacts(c.fullReferanse) : apa.fullReference;

          return `
          <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px; background-color: #f8fafc; page-break-inside: avoid;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">
              Kort-ID: ${c.id || `FF-${i + 1}`} &bull; Emne: ${escapeHtml(c.emne || '')} &bull; Type: ${escapeHtml(c.korttype || 'Definisjon')} &bull; Nivå: ${escapeHtml(c.niva || 'Grunnleggende')}
            </div>
            <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
              SPØRSMÅL / BEGREP: ${escapeHtml(c.forside || c.question)}
            </div>
            <div style="font-size: 13.5px; color: #1e293b; line-height: 1.55; margin-bottom: 10px;">
              <strong>KORREKT SVAR & FORKLARING:</strong><br>${escapeHtml(c.bakside || c.answer).replace(/\n/g, '<br>')}
            </div>
            <div style="font-size: 11px; color: #0284c7; background: #e0f2fe; padding: 5px 10px; border-radius: 4px; display: inline-block;">
              <strong>KILDE (APA 7):</strong> ${escapeHtml(apa.inText)}
            </div>
            ${
              fullRef && fullRef !== apa.inText
                ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 4px; font-style: italic;">Bibliografi: ${escapeHtml(fullRef)}</div>`
                : ''
            }
          </div>`;
        })
        .join('');

      return `
      <div style="${catIdx > 0 ? 'page-break-before: always; margin-top: 30px;' : ''}">
        <h2 style="color: #0f172a; font-size: 18px; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 16px;">
          ${catIdx + 1}. ${escapeHtml(cat)} (${catCards.length} kort)
        </h2>
        ${cardsHtml}
      </div>`;
    })
    .join('');

  const wordDocumentContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${escapeHtml(deck.title)} - FlashForge Kompendium</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; }
        h1 { color: #0f172a; font-size: 24px; border-bottom: 3px solid #0284c7; padding-bottom: 8px; margin-bottom: 6px; }
        p.subtitle { color: #475569; font-size: 13px; margin-bottom: 24px; }
        table.toc { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(deck.title)}</h1>
      <p class="subtitle">FlashForge Studiekompendium &bull; Generert ${new Date().toLocaleDateString('no-NO')} &bull; Totalt ${deckCards.length} kort</p>

      <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 10px;">Innholdsfortegnelse etter emner</h3>
      <table class="toc">
        ${tocHtml}
      </table>

      ${sectionsHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocumentContent], { type: 'application/msword;charset=utf-8' });
  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(blob, `${safeTitle}_studiekompendium.doc`);
  return deckCards.length;
}

// 4. Export Deck to Anki (.txt)
export function exportDeckToAnki(deck: Deck, cards: Flashcard[]): number {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

  let ankiText = `#separator:tab\n#html:true\n#tags column:3\n`;

  deckCards.forEach((c) => {
    const front = escapeHtml(c.forside || c.question);
    const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
    const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);
    const fullRef = c.fullReferanse ? cleanReferenceArtifacts(c.fullReferanse) : apa.fullReference;

    const refHtml = fullRef && fullRef !== apa.inText
      ? `<br><small style="color:#64748b;">${escapeHtml(fullRef)}</small>`
      : '';
    const back = `${escapeHtml(c.bakside || c.answer).replace(/\n/g, '<br>')}<br><br><span style="font-size:0.85em;color:#0284c7;"><b>Kilde (APA 7):</b> ${escapeHtml(apa.inText)}</span>${refHtml}`;

    const katTag = (c.kategori || 'Fag').replace(/\s+/g, '_');
    const emneTag = (c.emne || deck.title).replace(/\s+/g, '_');
    const nivaTag = (c.niva || 'Grunnleggende').replace(/\s+/g, '_');
    const tags = `${katTag} ${emneTag} ${nivaTag}`;

    ankiText += `${front.replace(/\t/g, ' ')}\t${back.replace(/\t/g, ' ')}\t${tags}\n`;
  });

  const blob = new Blob([ankiText], { type: 'text/plain;charset=utf-8' });
  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(blob, `${safeTitle}_anki.txt`);
  return deckCards.length;
}

// 5. Generate Quizlet import text & download
export function generateQuizletText(deck: Deck, cards: Flashcard[]): string {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);
  return deckCards
    .map((c) => {
      const term = (c.forside || c.question).replace(/\t/g, ' ').replace(/\n/g, ' ');
      const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
      const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);
      const def = `${c.bakside || c.answer} [Kilde (APA 7): ${apa.inText}]`.replace(/\t/g, ' ').replace(/\n/g, ' ');
      return `${term}\t${def}`;
    })
    .join('\n');
}

export function exportDeckToQuizlet(deck: Deck, cards: Flashcard[]): number {
  const text = generateQuizletText(deck, cards);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(blob, `${safeTitle}_quizlet.txt`);
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);
  return deckCards.length;
}

// 6. Full JSON Backup
export function exportDeckToJson(deck: Deck, cards: Flashcard[]): number {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);
  const data = {
    exportVersion: '2.0-APA7',
    exportedAt: new Date().toISOString(),
    deck,
    cards: deckCards,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(blob, `${safeTitle}_backup.json`);
  return deckCards.length;
}

// 7. Professional Printable PDF Engine with 5 Distinct Modes
export function exportDeckToPrintablePdf(
  deck: Deck,
  cards: Flashcard[],
  mode: PdfPrintMode = 'study_cards'
): number {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

  let bodyContent = '';
  let modeTitle = '';

  if (mode === 'print_cut') {
    modeTitle = 'Print & Cut Dobbeltsidig Flashcard-layout';
    // 6 cards per sheet. Page A: 6 Fronts. Page B: 6 Matching Backs mirrored horizontally for perfect duplex matching!
    const CHUNK = 6;
    const pagesHtml: string[] = [];

    for (let idx = 0; idx < deckCards.length; idx += CHUNK) {
      const batch = deckCards.slice(idx, idx + CHUNK);

      // FRONT SHEET (Questions only, no references)
      const frontGrid = batch
        .map((c) => `
        <div class="card-cell front-cell">
          <div class="cell-top">
            <span class="cell-id">${escapeHtml(c.id)}</span>
            <span class="cell-cat">${escapeHtml(c.kategori || '')}</span>
          </div>
          <div class="cell-label">SPØRSMÅL / FORSIDE</div>
          <div class="cell-question">${escapeHtml(c.forside || c.question)}</div>
          <div class="cell-footer">Klippelinje &bull; Brett/Klipp</div>
        </div>`)
        .join('');

      // BACK SHEET (Answers + APA 7 references, mirrored horizontally for 3-column duplex printing)
      // If batch has 6 items in 2 rows of 3:
      // Row 1: 0, 1, 2 -> mirrored: 2, 1, 0
      // Row 2: 3, 4, 5 -> mirrored: 5, 4, 3
      const mirroredBatch: (Flashcard | null)[] = [];
      const row1 = batch.slice(0, 3);
      while (row1.length < 3) row1.push(null as any);
      mirroredBatch.push(row1[2], row1[1], row1[0]);

      const row2 = batch.slice(3, 6);
      while (row2.length < 3) row2.push(null as any);
      mirroredBatch.push(row2[2], row2[1], row2[0]);

      const backGrid = mirroredBatch
        .map((c) => {
          if (!c) return `<div class="card-cell back-cell empty"></div>`;
          const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
          const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);

          return `
          <div class="card-cell back-cell">
            <div class="cell-top">
              <span class="cell-id">${escapeHtml(c.id)} (Bakside)</span>
              <span class="cell-cat">${escapeHtml(c.korttype || 'Definisjon')}</span>
            </div>
            <div class="cell-label back-label">KORREKT SVAR & FORKLARING</div>
            <div class="cell-answer">${escapeHtml(c.bakside || c.answer).replace(/\n/g, '<br>')}</div>
            <div class="cell-ref"><strong>Kilde (APA 7):</strong> ${escapeHtml(apa.inText)}</div>
          </div>`;
        })
        .join('');

      pagesHtml.push(`
        <div class="sheet-page">
          <div class="sheet-header">Side ${Math.floor(idx / CHUNK) * 2 + 1}: Forsider (Spørsmål) &bull; ${escapeHtml(deck.title)}</div>
          <div class="sheet-grid-6">${frontGrid}</div>
        </div>
        <div class="sheet-page">
          <div class="sheet-header">Side ${Math.floor(idx / CHUNK) * 2 + 2}: Baksider (Svar & Kilder) &bull; Speilet for tosidig utskrift</div>
          <div class="sheet-grid-6">${backGrid}</div>
        </div>
      `);
    }

    bodyContent = pagesHtml.join('');
  } else if (mode === 'compact') {
    modeTitle = 'Kompakt Utskrift (Flere kort per ark for å spare papir)';
    const cardsHtml = deckCards
      .map((c) => {
        const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
        const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);

        return `
        <div class="compact-card">
          <div class="compact-header">
            <span>${escapeHtml(c.id)}</span>
            <span>${escapeHtml(c.kategori || '')}</span>
          </div>
          <div class="compact-q"><strong>Spørsmål:</strong> ${escapeHtml(c.forside || c.question)}</div>
          <div class="compact-a"><strong>Svar:</strong> ${escapeHtml(c.bakside || c.answer).replace(/\n/g, '<br>')}</div>
          <div class="compact-ref">Kilde (APA 7): ${escapeHtml(apa.inText)}</div>
        </div>`;
      })
      .join('');

    bodyContent = `<div class="compact-grid">${cardsHtml}</div>`;
  } else if (mode === 'full_size') {
    modeTitle = 'Store Premium Flashcards (1 kort per side)';
    const cardsHtml = deckCards
      .map((c, i) => {
        const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
        const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);
        const fullRef = c.fullReferanse ? cleanReferenceArtifacts(c.fullReferanse) : apa.fullReference;

        return `
        <div class="full-card-page">
          <div class="full-card-box">
            <div class="full-top">
              <span class="full-id">${escapeHtml(c.id)} &bull; Kort ${i + 1} av ${deckCards.length}</span>
              <span class="full-cat">${escapeHtml(c.kategori || '')} &bull; ${escapeHtml(c.emne || '')}</span>
            </div>
            <div class="full-q-label">SPØRSMÅL / FORSIDE</div>
            <div class="full-question">${escapeHtml(c.forside || c.question)}</div>
            <div class="full-divider"></div>
            <div class="full-a-label">KORREKT SVAR & FAGLIG FORKLARING</div>
            <div class="full-answer">${escapeHtml(c.bakside || c.answer).replace(/\n/g, '<br>')}</div>
            <div class="full-ref-box">
              <strong>Kildehenvisning (APA 7):</strong> ${escapeHtml(apa.inText)}
              ${fullRef && fullRef !== apa.inText ? `<br><small style="color: #64748b;">Bibliografi: ${escapeHtml(fullRef)}</small>` : ''}
            </div>
          </div>
        </div>`;
      })
      .join('');

    bodyContent = cardsHtml;
  } else if (mode === 'booklet') {
    modeTitle = 'Studiehefte / Kompendium (Strukturert for lesing)';
    // Group by category
    const catMap: Record<string, Flashcard[]> = {};
    deckCards.forEach((c) => {
      const cat = c.kategori || 'Pensum';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(c);
    });

    const bookletHtml = Object.keys(catMap)
      .sort()
      .map((cat, idx) => {
        const catCards = catMap[cat];
        const rows = catCards
          .map((c, i) => {
            const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
            const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);

            return `
            <div class="booklet-item">
              <div class="booklet-q-row">
                <span class="booklet-num">${i + 1}.</span>
                <span class="booklet-id">[${escapeHtml(c.id)}]</span>
                <strong class="booklet-q">${escapeHtml(c.forside || c.question)}</strong>
              </div>
              <div class="booklet-a">${escapeHtml(c.bakside || c.answer).replace(/\n/g, '<br>')}</div>
              <div class="booklet-ref">Kilde (APA 7): ${escapeHtml(apa.inText)}</div>
            </div>`;
          })
          .join('');

        return `
        <div class="booklet-section">
          <h2 class="booklet-cat-title">${idx + 1}. ${escapeHtml(cat)} (${catCards.length} spørsmål)</h2>
          ${rows}
        </div>`;
      })
      .join('');

    bodyContent = `
      <div class="booklet-cover">
        <h1 class="booklet-main-title">${escapeHtml(deck.title)}</h1>
        <p class="booklet-subtitle">FlashForge Studiehefte &bull; Komplett pensumkompendium &bull; ${deckCards.length} spørsmål og svar</p>
      </div>
      <div class="booklet-body">${bookletHtml}</div>
    `;
  } else {
    // Default: 'study_cards' (2 cards per page, neat flashcard boxes)
    modeTitle = 'Studiekort (Klassisk brettbart og utskriftsvennlig oppsett)';
    const cardsHtml = deckCards
      .map((c, i) => {
        const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
        const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);
        const fullRef = c.fullReferanse ? cleanReferenceArtifacts(c.fullReferanse) : apa.fullReference;

        return `
        <div class="study-card-box">
          <div class="card-side front-box">
            <div class="card-meta">
              <span class="meta-id">${escapeHtml(c.id)}</span>
              <span class="meta-cat">${escapeHtml(c.kategori || '')}</span>
            </div>
            <div class="side-title">SPØRSMÅL / FORSIDE</div>
            <div class="card-q-text">${escapeHtml(c.forside || c.question)}</div>
            <div class="fold-line">&bull; Brett her eller klipp &bull;</div>
          </div>
          <div class="card-side back-box">
            <div class="card-meta">
              <span class="meta-type">${escapeHtml(c.korttype || 'Svar')}</span>
              <span class="meta-level">${escapeHtml(c.niva || 'Grunnleggende')}</span>
            </div>
            <div class="side-title back-title">KORREKT SVAR & FORKLARING</div>
            <div class="card-a-text">${escapeHtml(c.bakside || c.answer).replace(/\n/g, '<br>')}</div>
            <div class="ref-pill">
              <strong>KILDE (APA 7):</strong> ${escapeHtml(apa.inText)}
              ${fullRef && fullRef !== apa.inText ? `<br><small>${escapeHtml(fullRef)}</small>` : ''}
            </div>
          </div>
        </div>`;
      })
      .join('');

    bodyContent = `<div class="study-cards-grid">${cardsHtml}</div>`;
  }

  const printDocumentHtml = `<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(deck.title)} &bull; FlashForge Profesjonell PDF Eksport</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Floating No-Print Toolbar */
    .no-print-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #38bdf8;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .toolbar-title { font-size: 14px; font-weight: 800; color: #ffffff; }
    .toolbar-sub { font-size: 12px; color: #94a3b8; }
    .btn-print {
      background: #0284c7;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .btn-print:hover { background: #0369a1; }

    /* Print & Cut Layout */
    .sheet-page {
      page-break-after: always;
      height: 100%;
      min-height: 260mm;
      display: flex;
      flex-direction: column;
      margin-bottom: 20px;
    }
    .sheet-header {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .sheet-grid-6 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 12px;
      flex: 1;
    }
    .card-cell {
      border: 1.5px dashed #475569;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      min-height: 120mm;
    }
    .front-cell { background: #f8fafc; }
    .back-cell { background: #f0fdf4; border-color: #16a34a; }
    .back-cell.empty { border: none; background: transparent; }
    .cell-top { display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    .cell-label { font-size: 10px; font-weight: 800; color: #0284c7; letter-spacing: 0.05em; margin-bottom: 6px; }
    .back-label { color: #16a34a; }
    .cell-question { font-size: 13.5px; font-weight: 700; line-height: 1.4; color: #0f172a; flex: 1; }
    .cell-answer { font-size: 12px; line-height: 1.5; color: #1e293b; flex: 1; }
    .cell-ref { font-size: 9.5px; color: #0369a1; background: #e0f2fe; padding: 4px 6px; border-radius: 4px; margin-top: 8px; }
    .cell-footer { font-size: 8.5px; color: #94a3b8; text-align: center; margin-top: 6px; }

    /* Compact Layout */
    .compact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .compact-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .compact-header { display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 700; color: #64748b; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 3px; }
    .compact-q { font-size: 12px; color: #0f172a; margin-bottom: 6px; }
    .compact-a { font-size: 11.5px; color: #334155; line-height: 1.45; margin-bottom: 6px; }
    .compact-ref { font-size: 9.5px; color: #0284c7; }

    /* Full Size Layout */
    .full-card-page {
      page-break-after: always;
      height: 100%;
      min-height: 250mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10mm;
    }
    .full-card-box {
      border: 2px solid #0f172a;
      border-radius: 16px;
      padding: 30px;
      width: 100%;
      background: #f8fafc;
    }
    .full-top { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
    .full-q-label { font-size: 13px; font-weight: 900; color: #0284c7; letter-spacing: 0.05em; margin-bottom: 8px; }
    .full-question { font-size: 20px; font-weight: 800; line-height: 1.4; color: #0f172a; margin-bottom: 20px; }
    .full-divider { border-bottom: 1.5px dashed #94a3b8; margin: 20px 0; }
    .full-a-label { font-size: 13px; font-weight: 900; color: #16a34a; letter-spacing: 0.05em; margin-bottom: 8px; }
    .full-answer { font-size: 15px; line-height: 1.6; color: #1e293b; margin-bottom: 20px; }
    .full-ref-box { font-size: 12px; color: #0369a1; background: #e0f2fe; padding: 10px 14px; border-radius: 8px; }

    /* Booklet / Compendium Layout */
    .booklet-cover {
      text-align: center;
      padding: 30px 10px 24px;
      border-bottom: 3px solid #0284c7;
      margin-bottom: 24px;
    }
    .booklet-main-title { font-size: 24px; font-weight: 900; color: #0f172a; }
    .booklet-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .booklet-section { margin-bottom: 24px; }
    .booklet-cat-title { font-size: 16px; font-weight: 800; color: #0284c7; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px; page-break-after: avoid; }
    .booklet-item { padding: 10px 0; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; }
    .booklet-q-row { font-size: 13.5px; color: #0f172a; margin-bottom: 4px; }
    .booklet-num { font-weight: 800; color: #0284c7; margin-right: 4px; }
    .booklet-id { font-size: 10px; font-family: monospace; color: #64748b; margin-right: 6px; }
    .booklet-a { font-size: 12px; color: #334155; line-height: 1.5; margin-left: 20px; margin-bottom: 4px; }
    .booklet-ref { font-size: 10px; color: #0284c7; margin-left: 20px; font-style: italic; }

    /* Study Cards (Default) Layout */
    .study-cards-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .study-card-box {
      border: 1.5px dashed #475569;
      border-radius: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 16px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .card-side {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 180px;
    }
    .front-box { padding-right: 12px; border-right: 1.5px dashed #cbd5e1; }
    .card-meta { display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    .side-title { font-size: 10px; font-weight: 800; color: #0284c7; letter-spacing: 0.05em; margin-bottom: 6px; }
    .back-title { color: #16a34a; }
    .card-q-text { font-size: 14px; font-weight: 700; line-height: 1.4; color: #0f172a; flex: 1; }
    .card-a-text { font-size: 12.5px; line-height: 1.5; color: #1e293b; flex: 1; }
    .fold-line { font-size: 9px; color: #94a3b8; text-align: center; margin-top: 6px; }
    .ref-pill { font-size: 10px; color: #0369a1; background: #e0f2fe; padding: 6px 8px; border-radius: 6px; margin-top: 8px; }

    /* Strict Media Print Formatting: Removes UI chrome & Instructions completely */
    @media print {
      body { padding: 0; background: #fff !important; }
      .no-print, .no-print-toolbar { display: none !important; }
      .sheet-page { margin-bottom: 0; }
      .card-cell, .compact-card, .study-card-box, .full-card-page, .booklet-item {
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar no-print">
    <div>
      <div class="toolbar-title">${escapeHtml(deck.title)} &bull; ${deckCards.length} Kort</div>
      <div class="toolbar-sub">${modeTitle} &bull; Referanser kun på baksiden &bull; APA 7</div>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Skriv ut / Lagre som PDF
    </button>
  </div>

  <div style="padding: 15px 20px;">
    ${bodyContent}
  </div>

  <script>
    // Automatically trigger print dialog on load
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  // Try opening print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printDocumentHtml);
    printWindow.document.close();
  } else {
    // If popups are blocked by browser, trigger direct HTML download
    const blob = new Blob([printDocumentHtml], { type: 'text/html;charset=utf-8' });
    const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    triggerDownload(blob, `${safeTitle}_print_pdf_${mode}.html`);
  }

  return deckCards.length;
}

// 8. Standalone Digital Plug & Play Player for Mac & Windows (Zero install, zero dependencies)
export function exportStandaloneDigitalPlayer(deck: Deck, cards: Flashcard[]): void {
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

  // Prepare cards with clean APA 7 references
  const normalizedCards = deckCards.map((c) => {
    const rawRef = cleanReferenceArtifacts(c.referansehenvisning || c.reference || '');
    const apa = formatToApa7Reference(rawRef, c.kildedokument, c.kildeseksjon, c.kategori);
    const fullRef = c.fullReferanse ? cleanReferenceArtifacts(c.fullReferanse) : apa.fullReference;

    return {
      id: c.id,
      kategori: c.kategori || 'Fag',
      emne: c.emne || deck.title,
      korttype: c.korttype || 'Definisjon',
      niva: c.niva || 'Grunnleggende',
      forside: c.forside || c.question,
      bakside: c.bakside || c.answer,
      referansehenvisning: apa.inText,
      fullReferanse: fullRef,
      design: c.design || 'Clinical',
      box: c.srs?.box || 1,
    };
  });

  const cardsJsonSafe = JSON.stringify(normalizedCards).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  const standaloneHtml = `<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(deck.title)} &bull; FlashForge Digital Spiller (Mac & Windows)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0b0f17;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #38bdf8;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 16px;
    }
    header {
      max-width: 900px;
      width: 100%;
      margin: 0 auto 16px;
      padding: 16px 20px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1 { font-size: 18px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }
    .badge { background: #0369a1; color: #fff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
    .meta-tag { font-size: 11px; color: var(--text-muted); }
    .container { max-width: 900px; width: 100%; margin: 0 auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }

    /* Controls bar */
    .controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      background: #0f172a;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid #1e293b;
    }
    input, select, button {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    input:focus, select:focus { border-color: var(--accent); }
    button {
      background: var(--primary);
      border: none;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    button:hover { background: var(--primary-hover); }
    button.secondary { background: #1e293b; border: 1px solid #334155; }
    button.secondary:hover { background: #334155; }

    /* Flashcard presentation & Modern Theme Styles */
    .flashcard-wrapper {
      perspective: 1000px;
      min-height: 380px;
      width: 100%;
      cursor: pointer;
    }
    .flashcard {
      position: relative;
      width: 100%;
      min-height: 380px;
      background: #0c1424;
      border: 2px solid #1e293b;
      border-radius: 20px;
      padding: 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease-in-out;
      box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.55);
    }
    .flashcard:hover {
      border-color: #38bdf8;
      box-shadow: 0 16px 36px -5px rgba(56, 189, 248, 0.2);
    }

    /* Modern Theme Overrides */
    .flashcard.theme-nordic { background: #0c1424; border-color: #1e293b; color: #f1f5f9; }
    .flashcard.theme-clinical { background: #041619; border-color: #14b8a6; color: #f0fdfa; }
    .flashcard.theme-clinical .side-label { color: #14b8a6; }
    .flashcard.theme-dark { background: #090b10; border-color: #d97706; color: #fffbeb; box-shadow: 0 12px 35px rgba(245,158,11,0.14); }
    .flashcard.theme-dark .side-label { color: #f59e0b; }
    .flashcard.theme-light { background: #faf8f5; border-color: #d6d0c4; color: #0f172a; box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
    .flashcard.theme-light .question-title { color: #0f172a; }
    .flashcard.theme-light .answer-box { color: #1e293b; }
    .flashcard.theme-light .side-label { color: #0284c7; }
    .flashcard.theme-light .card-cat-tag { color: #64748b; }
    .flashcard.theme-light .card-top, .flashcard.theme-light .card-bottom { border-color: #e2ded5; }
    .flashcard.theme-light.flipped .question-title { color: #64748b; }
    .flashcard.theme-swiss { background: #0a0a0c; border-color: #525252; color: #fafafa; }
    .flashcard.theme-swiss .side-label { color: #e5e5e5; }
    .flashcard.theme-academic { background: #15110e; border-color: #78350f; color: #fef3c7; font-family: Georgia, Cambria, serif; }
    .flashcard.theme-academic .side-label { color: #d4af37; font-family: Georgia, serif; }
    .flashcard.theme-cyber { background: #061627; border-color: #0284c7; color: #e0f2fe; }
    .flashcard.theme-cyber .side-label { color: #38bdf8; font-family: monospace; }
    .flashcard.theme-emergency { background: #180608; border-color: #dc2626; color: #fee2e2; }
    .flashcard.theme-emergency .side-label { color: #ef4444; }
    .flashcard.theme-pharma { background: #05181b; border-color: #06b6d4; color: #ecfeff; }
    .flashcard.theme-pharma .side-label { color: #06b6d4; }
    .flashcard.theme-highcontrast { background: #000000; border: 2.5px solid #facc15; color: #ffffff; }
    .flashcard.theme-highcontrast .question-title { color: #facc15; font-weight: 900; }
    .flashcard.theme-highcontrast .side-label { color: #facc15; font-weight: 900; }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #1f2937;
    }
    .card-id-tag {
      font-size: 11px;
      font-weight: 800;
      color: var(--accent);
      background: rgba(56, 189, 248, 0.1);
      padding: 4px 8px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }
    .card-cat-tag { font-size: 12px; color: var(--text-muted); font-weight: 600; }
    .content-area { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .side-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #38bdf8;
      margin-bottom: 12px;
    }
    .question-title {
      font-size: 20px;
      font-weight: 800;
      line-height: 1.45;
      color: #ffffff;
      white-space: pre-line;
    }
    .back-context-box {
      display: none;
      padding-bottom: 10px;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .back-context-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #38bdf8;
      margin-bottom: 2px;
    }
    .back-context-text {
      font-size: 13.5px;
      color: #cbd5e1;
      font-weight: 600;
    }
    .answer-box {
      font-size: 16px;
      line-height: 1.6;
      color: #e2e8f0;
      white-space: pre-line;
      margin-top: 10px;
      display: none;
    }
    .flashcard.flipped .answer-box { display: block; }
    .flashcard.flipped .back-context-box { display: block; }
    .flashcard.flipped .side-label { color: #34d399; }
    .flashcard.flipped .question-title { display: none; }

    /* Bottom reference strictly on backside */
    .card-bottom {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid #1f2937;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .reference-pill {
      font-size: 12px;
      color: #38bdf8;
      background: #082f49;
      border: 1px solid #0369a1;
      padding: 6px 12px;
      border-radius: 8px;
      display: none;
    }
    .flashcard.flipped .reference-pill { display: inline-block; }
    .tap-hint { font-size: 11px; color: #64748b; }

    /* Action bar */
    .action-bar {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .nav-buttons {
      display: flex;
      gap: 10px;
      justify-content: space-between;
    }
    .ratings-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      display: none;
    }
    .flashcard-wrapper.is-flipped + .action-bar .ratings-grid {
      display: grid;
    }
    .btn-rating {
      padding: 12px 8px;
      font-size: 12px;
      flex-direction: column;
      border-radius: 12px;
    }
    .btn-rate-1 { background: #4c0519; border: 1px solid #9f1239; color: #fecdd3; }
    .btn-rate-1:hover { background: #881337; }
    .btn-rate-2 { background: #451a03; border: 1px solid #92400e; color: #fde68a; }
    .btn-rate-2:hover { background: #78350f; }
    .btn-rate-3 { background: #064e3b; border: 1px solid #065f46; color: #a7f3d0; }
    .btn-rate-3:hover { background: #047857; }
    .btn-rate-4 { background: #082f49; border: 1px solid #075985; color: #bae6fd; }
    .btn-rate-4:hover { background: #0369a1; }

    .optional-notice {
      font-size: 11px;
      color: #64748b;
      text-align: center;
      line-height: 1.4;
      background: #0f172a;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #1e293b;
    }

    /* TTS Audio */
    .btn-speak { background: #1e293b; border: 1px solid #334155; color: #38bdf8; padding: 6px 12px; font-size: 11px; border-radius: 8px; }
    .btn-speak:hover { background: #334155; }

    @media (max-width: 600px) {
      .ratings-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>⚡ FlashForge Pro &bull; Digital Spiller</h1>
      <div class="meta-tag">${escapeHtml(deck.title)} &bull; Mac & Windows Plug & Play &bull; Frakoblet</div>
    </div>
    <div class="badge" id="counterBadge">Kort 1 av ${normalizedCards.length}</div>
  </header>

  <div class="container">
    <!-- Controls -->
    <div class="controls">
      <input type="text" id="searchInput" placeholder="Søk i spørsmål, svar eller APA 7 referanser..." style="flex: 1; min-width: 170px;">
      <select id="categoryFilter">
        <option value="all">Alle kategorier</option>
      </select>
      <select id="themeSelector" onchange="changeTheme(this.value)" title="Velg visuelt kortdesign">
        <option value="nordic">🎨 Nordic Modern</option>
        <option value="clinical">🏥 Clinical Studio</option>
        <option value="dark">💎 Obsidian Gold</option>
        <option value="light">📜 Studio Ivory</option>
        <option value="swiss">⚪ Swiss Minimal</option>
        <option value="academic">🏛️ Oxford Academic</option>
        <option value="cyber">📐 Cyber Blueprint</option>
        <option value="emergency">🚨 Trauma Emergency</option>
        <option value="pharma">💊 Pharmacology Mint</option>
        <option value="highcontrast">⚡ High Contrast AAA</option>
      </select>
      <button onclick="toggleVoiceSpeech()" class="secondary btn-speak" id="speechBtn">🔊 Les høyt</button>
      <button onclick="shuffleCards()" class="secondary" title="Stokk om">🔀 Stokk</button>
    </div>

    <!-- Flashcard -->
    <div class="flashcard-wrapper" id="cardWrapper" onclick="flipCard()">
      <div class="flashcard theme-nordic" id="cardElement">
        <div class="card-top">
          <span class="card-id-tag" id="cardId">FF-0001</span>
          <span class="card-cat-tag" id="cardCat">Kategori</span>
        </div>

        <div class="content-area">
          <div class="side-label" id="sideLabel">FORSIDE &bull; SPØRSMÅL / CASE</div>
          <div class="question-title" id="questionText">Laster spørsmål...</div>
          <div class="back-context-box" id="backContextBox">
            <div class="back-context-label">Spørsmål / Begrep:</div>
            <div class="back-context-text" id="backContextText">...</div>
          </div>
          <div class="answer-box" id="answerText">Laster svar...</div>
        </div>

        <div class="card-bottom">
          <div class="reference-pill" id="refText">Kilde (APA 7): ...</div>
          <div class="tap-hint" id="tapHint">Trykk på kortet eller trykk Mellomrom for å snu</div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="nav-buttons">
        <button onclick="prevCard()" class="secondary" style="flex: 1;">&larr; Forrige kort</button>
        <button onclick="flipCard()" id="flipBtn" style="flex: 2; background: #3b82f6;">Snu kort (Mellomrom)</button>
        <button onclick="nextCard()" style="flex: 1; background: #10b981;">Neste kort &rarr;</button>
      </div>

      <!-- Optional Rating Buttons -->
      <div class="ratings-grid" id="ratingsGrid">
        <button onclick="rateAndNext('again')" class="btn-rating btn-rate-1">
          <span style="font-size: 10px; opacity: 0.8;">Tast 1</span>
          <strong>Glemte</strong>
        </button>
        <button onclick="rateAndNext('hard')" class="btn-rating btn-rate-2">
          <span style="font-size: 10px; opacity: 0.8;">Tast 2</span>
          <strong>Vanskelig</strong>
        </button>
        <button onclick="rateAndNext('good')" class="btn-rating btn-rate-3">
          <span style="font-size: 10px; opacity: 0.8;">Tast 3</span>
          <strong>Klarte det</strong>
        </button>
        <button onclick="rateAndNext('easy')" class="btn-rating btn-rate-4">
          <span style="font-size: 10px; opacity: 0.8;">Tast 4</span>
          <strong>Enkelt</strong>
        </button>
      </div>

      <div class="optional-notice">
        ℹ️ <strong>Valgfri vurdering:</strong> Du kan trykke <em>Neste kort &rarr;</em> direkte for å gå videre. Dersom du velger hvor godt du husket det (1–4), hjelper du FlashForge med å repetere vanskeligere kort oftere i neste stokk.
      </div>
    </div>
  </div>

  <script>
    const ALL_CARDS = ${cardsJsonSafe};
    let activeCards = [...ALL_CARDS];
    let currentIndex = 0;
    let isFlipped = false;

    // Populate category dropdown
    const catSelect = document.getElementById('categoryFilter');
    const uniqueCats = Array.from(new Set(ALL_CARDS.map(c => c.kategori).filter(Boolean)));
    uniqueCats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });

    let currentTheme = 'nordic';
    try {
      const savedTheme = localStorage.getItem('flashforge_player_theme');
      if (savedTheme) {
        currentTheme = savedTheme;
        document.getElementById('themeSelector').value = savedTheme;
      }
    } catch (e) {}

    function changeTheme(theme) {
      currentTheme = theme;
      const cardEl = document.getElementById('cardElement');
      cardEl.className = 'flashcard theme-' + theme + (isFlipped ? ' flipped' : '');
      try { localStorage.setItem('flashforge_player_theme', theme); } catch (e) {}
    }

    function renderCurrentCard() {
      if (activeCards.length === 0) {
        document.getElementById('questionText').textContent = 'Ingen kort matcher søkekriteriene.';
        document.getElementById('backContextText').textContent = '';
        document.getElementById('answerText').textContent = '';
        document.getElementById('refText').style.display = 'none';
        document.getElementById('counterBadge').textContent = '0 Kort';
        return;
      }

      if (currentIndex >= activeCards.length) currentIndex = 0;
      if (currentIndex < 0) currentIndex = activeCards.length - 1;

      const card = activeCards[currentIndex];
      document.getElementById('cardId').textContent = card.id;
      document.getElementById('cardCat').textContent = card.kategori + (card.emne ? ' &bull; ' + card.emne : '');
      document.getElementById('questionText').textContent = card.forside;
      document.getElementById('backContextText').textContent = card.forside;
      document.getElementById('answerText').innerHTML = (card.bakside || '').replace(/\\n/g, '<br>');
      document.getElementById('refText').textContent = 'Kilde (APA 7): ' + card.referansehenvisning;
      document.getElementById('counterBadge').textContent = 'Kort ' + (currentIndex + 1) + ' av ' + activeCards.length;

      // Reset flip state
      isFlipped = false;
      updateFlipUI();
    }

    function flipCard() {
      isFlipped = !isFlipped;
      updateFlipUI();
    }

    function updateFlipUI() {
      const cardEl = document.getElementById('cardElement');
      const wrapper = document.getElementById('cardWrapper');
      const ratings = document.getElementById('ratingsGrid');
      const flipBtn = document.getElementById('flipBtn');
      const sideLabel = document.getElementById('sideLabel');

      cardEl.className = 'flashcard theme-' + currentTheme + (isFlipped ? ' flipped' : '');

      if (isFlipped) {
        wrapper.classList.add('is-flipped');
        ratings.style.display = 'grid';
        flipBtn.textContent = 'Vis forside (Mellomrom)';
        sideLabel.textContent = 'BAKSIDE &bull; KORREKT SVAR & APA 7 REFERANSE';
      } else {
        wrapper.classList.remove('is-flipped');
        ratings.style.display = 'none';
        flipBtn.textContent = 'Vis svar & kilde (Mellomrom)';
        sideLabel.textContent = 'FORSIDE &bull; SPØRSMÅL / CASE';
      }
    }

    function nextCard() {
      if (currentIndex + 1 < activeCards.length) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      renderCurrentCard();
    }

    function prevCard() {
      if (currentIndex > 0) {
        currentIndex--;
      } else {
        currentIndex = activeCards.length - 1;
      }
      renderCurrentCard();
    }

    function rateAndNext(rating) {
      // Optional rating advances to next card smoothly
      nextCard();
    }

    function shuffleCards() {
      for (let i = activeCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeCards[i], activeCards[j]] = [activeCards[j], activeCards[i]];
      }
      currentIndex = 0;
      renderCurrentCard();
    }

    // Filter cards
    function filterCards() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const cat = catSelect.value;
      activeCards = ALL_CARDS.filter(c => {
        const matchCat = cat === 'all' || c.kategori === cat;
        const text = (c.forside + ' ' + c.bakside + ' ' + c.referansehenvisning).toLowerCase();
        return matchCat && text.includes(q);
      });
      currentIndex = 0;
      renderCurrentCard();
    }

    document.getElementById('searchInput').oninput = filterCards;
    catSelect.onchange = filterCards;

    // Speech TTS for Mac & Windows
    function toggleVoiceSpeech() {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const card = activeCards[currentIndex];
      if (!card) return;
      const textToSpeak = isFlipped ? card.bakside : card.forside;
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = 'no-NO';
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        flipCard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      } else if (e.key === 't' || e.key === 'T') {
        const themeList = ['nordic', 'clinical', 'dark', 'light', 'swiss', 'academic', 'cyber', 'emergency', 'pharma', 'highcontrast'];
        const nextIdx = (themeList.indexOf(currentTheme) + 1) % themeList.length;
        const nextTheme = themeList[nextIdx];
        document.getElementById('themeSelector').value = nextTheme;
        changeTheme(nextTheme);
      } else if (isFlipped) {
        if (e.key === '1') rateAndNext('again');
        if (e.key === '2') rateAndNext('hard');
        if (e.key === '3') rateAndNext('good');
        if (e.key === '4') rateAndNext('easy');
      }
    });

    renderCurrentCard();
  </script>
</body>
</html>`;

  const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(blob, `${safeTitle}_Digital_Spiller_Mac_Windows.html`);
}

// 9. Windows Standalone Desktop Package (.html + .bat launcher)
export function exportStandaloneWindowsPackage(deck: Deck, cards: Flashcard[]): void {
  exportStandaloneDigitalPlayer(deck, cards);

  // Also trigger .bat launcher file for instant double-click execution on Windows
  const batContent = `@echo off
title FlashForge Pro - Offline Windows Launcher
echo Starter FlashForge Pro lokalt...
start "" "${(deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_Digital_Spiller_Mac_Windows.html"
exit
`;
  const batBlob = new Blob([batContent], { type: 'application/x-bat' });
  triggerDownload(batBlob, 'Start_FlashForge_Windows.bat');
}

// 10. Mac Standalone App (.html + .command double-click launcher for macOS)
export function exportStandaloneMacApp(deck: Deck, cards: Flashcard[]): void {
  exportStandaloneDigitalPlayer(deck, cards);

  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const commandContent = `#!/bin/bash
# FlashForge Pro - macOS Launcher
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
open "$DIR/${safeTitle}_Digital_Spiller_Mac_Windows.html"
exit 0
`;
  const commandBlob = new Blob([commandContent], { type: 'application/x-sh' });
  triggerDownload(commandBlob, 'Start_FlashForge_Mac.command');
}

// 11. Raspberry Pi / Linux Standalone App (Lightweight HTML + .sh launcher)
export function exportStandaloneRaspberryPiApp(deck: Deck, cards: Flashcard[]): void {
  exportStandaloneDigitalPlayer(deck, cards);

  const safeTitle = (deck.title || 'flashforge').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const shContent = `#!/bin/bash
# FlashForge Pro - Raspberry Pi & Linux Launcher
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
HTML_FILE="$DIR/${safeTitle}_Digital_Spiller_Mac_Windows.html"
if which xdg-open > /dev/null; then
    xdg-open "$HTML_FILE"
elif which chromium-browser > /dev/null; then
    chromium-browser "$HTML_FILE"
elif which firefox > /dev/null; then
    firefox "$HTML_FILE"
else
    echo "Åpne $HTML_FILE i nettleseren din."
fi
exit 0
`;
  const shBlob = new Blob([shContent], { type: 'application/x-sh' });
  triggerDownload(shBlob, 'Start_FlashForge_Linux_Pi.sh');
}

// Validation helper for exports
export function verifyExportIntegrity(beforeCount: number, exportedCount: number, formatName: string): boolean {
  if (beforeCount !== exportedCount) {
    alert(`ADVARSEL VED EKSPORT TIL ${formatName}:\nAntall før eksport: ${beforeCount}\nAntall eksportert: ${exportedCount}\nDifferanse: ${beforeCount - exportedCount} kort mangler!`);
    return false;
  }
  return true;
}
