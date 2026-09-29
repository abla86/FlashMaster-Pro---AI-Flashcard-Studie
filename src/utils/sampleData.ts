import { Deck, Flashcard } from '../types/flashcard';

export const INITIAL_DECKS: Deck[] = [
  {
    id: 'deck-1',
    title: 'Fysiologi & Klinisk Medisin',
    description: 'Kardiovaskulær fysiologi, cellestruktur og biokjemi med direkte kildereferanser.',
    kategori: 'Medisin',
    tags: ['Medisin', 'Fysiologi', 'Helse'],
    defaultDesign: 'Clinical',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    sourceType: 'excel',
    sourceFileName: 'medisin_h26_notater.xlsx',
  },
  {
    id: 'deck-2',
    title: 'Algoritmer & Systemarkitektur',
    description: 'Datastrukturer, kompleksitetsanalyse og distribuerte prinsipper.',
    kategori: 'Informatikk',
    tags: ['IT', 'Algoritmer', 'Informatikk'],
    defaultDesign: 'Process',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    sourceType: 'ai',
  },
  {
    id: 'deck-3',
    title: 'Fysikk & Termodynamikk',
    description: 'Termodynamikkens lover, mekanikk og grunnleggende formler.',
    kategori: 'Fysikk',
    tags: ['Fysikk', 'Ingeniør', 'Realfag'],
    defaultDesign: 'Formula',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 3,
    sourceType: 'pdf',
    sourceFileName: 'termo_kap4.pdf',
  },
];

export const INITIAL_CARDS: Flashcard[] = [
  {
    id: 'FF-2026-001',
    deckId: 'deck-1',
    kategori: 'Kardiologi',
    emne: 'Hjertefysiologi',
    korttype: 'Klinisk observasjon',
    niva: 'Middels',
    forside: 'Hva er Frank-Starling-mekanismen i hjertets fysiologi og dens kliniske konsekvens?',
    bakside: 'Kort svar: Jo mer ventriklene fylles under diastolen (preload), desto kraftigere kontraherer myokardfibrene under systolen.\n\nKlinisk forklaring: Sikrer at hjertet pumper ut nøyaktig det venøse tilbakeløpet det mottar, og forhindrer opphopning i lunge- eller systemsirkulasjonen.',
    referansehenvisning: 'Guyton & Hall: Medical Physiology, 14. utg., Kap. 9, s. 115',
    fullReferanse: 'Hall, J. E., & Hall, M. E. (2020). Guyton and Hall Textbook of Medical Physiology (14. utg.). Elsevier.',
    kildedokument: 'medisin_h26_notater.xlsx',
    kildeseksjon: 'Kapittel 9: Hjertets pumpefunksjon',
    design: 'Clinical',
    bildestatus: 'lokal_svg',
    bildeData: {
      position: 'side',
      svgContent: `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 82 C22 58 14 40 14 26 C14 15 23 9 35 12 C42 14 47 21 50 25 C53 21 58 14 65 12 C77 9 86 15 86 26 C86 40 78 58 50 82 Z" fill="#ef4444" opacity="0.9" stroke="#f87171" stroke-width="1.5"/>
        <polyline points="22,50 36,50 41,36 46,64 51,42 56,50 78,50" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      alt: 'Hjertefysiologi og EKG-rytme',
      isIllustrationNotice: true,
    },
    status: 'KLAR',
    referanseKobling: 'DIREKTE',
    tagger: ['Kardiologi', 'Fysiologi', 'Sirkulasjon'],
    
    // Aliases
    question: 'Hva er Frank-Starling-mekanismen i hjertets fysiologi og dens kliniske konsekvens?',
    answer: 'Kort svar: Jo mer ventriklene fylles under diastolen (preload), desto kraftigere kontraherer myokardfibrene under systolen.\n\nKlinisk forklaring: Sikrer at hjertet pumper ut nøyaktig det venøse tilbakeløpet det mottar, og forhindrer opphopning i lunge- eller systemsirkulasjonen.',
    reference: 'Guyton & Hall: Medical Physiology, 14. utg., Kap. 9, s. 115',
    frontExtra: 'Hint: Sammenheng mellom fylningstrykk og slagvolum.',
    backExtra: 'Mekanismen sikrer at hjertet pumper ut nøyaktig det venøse tilbakeløpet det mottar, uten opphopning i sirkulasjonen.',
    tags: ['Kardiologi', 'Fysiologi'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    srs: {
      box: 3,
      repetitionCount: 4,
      easeFactor: 2.6,
      intervalDays: 6,
      dueDate: Date.now() + 86400000 * 2,
      lastReviewed: Date.now() - 86400000 * 1,
      history: [
        { timestamp: Date.now() - 86400000 * 7, rating: 'good' },
        { timestamp: Date.now() - 86400000 * 1, rating: 'easy' },
      ],
    },
  },
  {
    id: 'FF-2026-002',
    deckId: 'deck-1',
    kategori: 'Biokjemi',
    emne: 'Celletransport',
    korttype: 'Definisjon',
    niva: 'Grunnleggende',
    forside: 'Hvilken støkiometrisk ionetransport og energikilde benyttes av Na+/K+-ATPasen?',
    bakside: 'Kort svar: Pumper 3 Na⁺ ut og 2 K⁺ inn per 1 ATP hydrolysert.\n\nForklaring: Primæraktiv transport som opprettholder det negative hvilemembranpotensialet (-70 mV) og skaper den elektrokjemiske gradienten for sekundæraktiv transport.',
    referansehenvisning: 'Boron & Boulpaep: Medical Physiology, Kap. 5, s. 102',
    fullReferanse: 'Boron, W. F., & Boulpaep, E. L. (2016). Medical Physiology (3. utg.). Elsevier.',
    kildedokument: 'medisin_h26_notater.xlsx',
    kildeseksjon: 'Kapittel 5: Active Transport',
    design: 'Definition',
    bildestatus: 'lokal_svg',
    bildeData: {
      position: 'side',
      svgContent: `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="38" fill="#0284c7" opacity="0.3" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 2"/>
        <path d="M50 25 L50 40 M50 60 L50 75" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <circle cx="50" cy="30" r="6" fill="#38bdf8"/>
        <circle cx="50" cy="70" r="6" fill="#34d399"/>
        <text x="50" y="54" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" font-family="sans-serif">3 Na⁺ / 2 K⁺</text>
      </svg>`,
      alt: 'Na/K pumpe membran',
      isIllustrationNotice: true,
    },
    status: 'KLAR',
    referanseKobling: 'DIREKTE',
    tagger: ['Cellebiologi', 'Biokjemi', 'Ionetransport'],
    
    // Aliases
    question: 'Hvilken støkiometrisk ionetransport og energikilde benyttes av Na+/K+-ATPasen?',
    answer: 'Kort svar: Pumper 3 Na⁺ ut og 2 K⁺ inn per 1 ATP hydrolysert.\n\nForklaring: Primæraktiv transport som opprettholder det negative hvilemembranpotensialet (-70 mV) og skaper den elektrokjemiske gradienten for sekundæraktiv transport.',
    reference: 'Boron & Boulpaep: Medical Physiology, Kap. 5, s. 102',
    frontExtra: 'Ioneforhold og energikilde?',
    backExtra: 'Helt avgjørende for nerveimpulsledning og sekundæraktiv transport av glukose og aminosyrer.',
    tags: ['Cellebiologi', 'Biokjemi'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    srs: {
      box: 2,
      repetitionCount: 2,
      easeFactor: 2.5,
      intervalDays: 3,
      dueDate: Date.now() + 86400000 * 1,
      lastReviewed: Date.now() - 86400000 * 2,
      history: [
        { timestamp: Date.now() - 86400000 * 5, rating: 'hard' },
        { timestamp: Date.now() - 86400000 * 2, rating: 'good' },
      ],
    },
  },
  {
    id: 'FF-2026-003',
    deckId: 'deck-2',
    kategori: 'Informatikk',
    emne: 'Søkealgoritmer',
    korttype: 'Dyp gjenhenting',
    niva: 'Avansert',
    forside: 'Hva er tidskompleksiteten og premissene for Binary Search?',
    bakside: 'Kort svar: O(log n) tidskompleksitet i verste og gjennomsnittlige tilfelle. Forutsetter sortert array.\n\nMekanisme: Halverer søkerommet for hver iterasjon. Ved 1 milliard elementer kreves maksimalt ~30 sammenligninger.',
    referansehenvisning: 'Cormen et al. (CLRS): Introduction to Algorithms, Del I, kap. 2.3',
    fullReferanse: 'Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2022). Introduction to Algorithms (4. utg.). MIT Press.',
    kildedokument: 'Pensumkompendium INF201',
    kildeseksjon: 'Kapittel 2.3: Divide and Conquer',
    design: 'Process',
    bildestatus: 'lokal_svg',
    bildeData: {
      position: 'side',
      svgContent: `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="20" width="80" height="20" rx="3" fill="#0f172a" stroke="#22d3ee" stroke-width="1.5"/>
        <line x1="30" y1="20" x2="30" y2="40" stroke="#22d3ee" stroke-width="1"/>
        <line x1="50" y1="20" x2="50" y2="40" stroke="#22d3ee" stroke-width="1"/>
        <line x1="70" y1="20" x2="70" y2="40" stroke="#22d3ee" stroke-width="1"/>
        <circle cx="50" cy="30" r="6" fill="#a855f7"/>
        <path d="M50 48 L50 68 M40 60 L50 68 L60 60" stroke="#38bdf8" stroke-width="2" fill="none"/>
        <text x="50" y="86" fill="#22d3ee" font-family="monospace" font-size="11" text-anchor="middle">O(log n)</text>
      </svg>`,
      alt: 'Binærsøk kompleksitet',
      isIllustrationNotice: true,
    },
    status: 'KLAR',
    referanseKobling: 'DIREKTE',
    tagger: ['Algoritmer', 'Big-O', 'Søk'],
    
    // Aliases
    question: 'Hva er tidskompleksiteten og premissene for Binary Search?',
    answer: 'Kort svar: O(log n) tidskompleksitet i verste og gjennomsnittlige tilfelle. Forutsetter sortert array.\n\nMekanisme: Halverer søkerommet for hver iterasjon. Ved 1 milliard elementer kreves maksimalt ~30 sammenligninger.',
    reference: 'Cormen et al. (CLRS): Introduction to Algorithms, Del I, kap. 2.3',
    tags: ['Algoritmer', 'Big-O'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    srs: {
      box: 4,
      repetitionCount: 6,
      easeFactor: 2.7,
      intervalDays: 14,
      dueDate: Date.now() + 86400000 * 8,
      lastReviewed: Date.now() - 86400000 * 4,
      history: [
        { timestamp: Date.now() - 86400000 * 18, rating: 'good' },
        { timestamp: Date.now() - 86400000 * 4, rating: 'easy' },
      ],
    },
  },
  {
    id: 'FF-2026-004',
    deckId: 'deck-3',
    kategori: 'Termodynamikk',
    emne: 'Entropi',
    korttype: 'Formel/Regning',
    niva: 'Avansert',
    forside: 'Hva fastslår termodynamikkens 2. hovedsetning om entropiendring i et isolert system?',
    bakside: 'Kort svar: Entropien kan aldri avta: ΔS_totalt ≥ 0.\n\nFysisk forklaring: Varme kan aldri spontant overføres fra et kaldere legeme til et varmere legeme uten ytre arbeidsinnsats (Clausius-formulering).',
    referansehenvisning: "Sears & Zemansky's University Physics, Kap. 20.3, s. 660",
    fullReferanse: 'Young, H. D., & Freedman, R. A. (2020). Sears and Zemansky’s University Physics with Modern Physics (15. utg.). Pearson.',
    kildedokument: 'termo_kap4.pdf',
    kildeseksjon: 'Kapittel 20: The Second Law of Thermodynamics',
    design: 'Formula',
    bildestatus: 'lokal_svg',
    bildeData: {
      position: 'top',
      svgContent: `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="20" width="35" height="60" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.5"/>
        <rect x="55" y="20" width="35" height="60" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.5"/>
        <text x="27" y="55" fill="#f87171" font-size="12" font-weight="bold" text-anchor="middle">T_varm</text>
        <text x="72" y="55" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">T_kald</text>
        <path d="M46 50 L54 50 M50 45 L55 50 L50 55" stroke="#fbbf24" stroke-width="2.5" fill="none"/>
        <text x="50" y="92" fill="#0ea5e9" font-family="monospace" font-size="9" text-anchor="middle">ΔS_tot ≥ 0</text>
      </svg>`,
      alt: 'Varmestrøm og entropi',
      isIllustrationNotice: true,
    },
    status: 'KLAR',
    referanseKobling: 'DIREKTE',
    tagger: ['Termodynamikk', 'Fysikk', 'Entropi'],
    
    // Aliases
    question: 'Hva fastslår termodynamikkens 2. hovedsetning om entropiendring i et isolert system?',
    answer: 'Kort svar: Entropien kan aldri avta: ΔS_totalt ≥ 0.\n\nFysisk forklaring: Varme kan aldri spontant overføres fra et kaldere legeme til et varmere legeme uten ytre arbeidsinnsats (Clausius-formulering).',
    reference: "Sears & Zemansky's University Physics, Kap. 20.3, s. 660",
    tags: ['Termodynamikk', 'Fysikk'],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 3,
    srs: {
      box: 1,
      repetitionCount: 1,
      easeFactor: 2.5,
      intervalDays: 1,
      dueDate: Date.now(),
      lastReviewed: Date.now() - 86400000 * 1,
      history: [{ timestamp: Date.now() - 86400000 * 1, rating: 'again' }],
    },
  },
];
