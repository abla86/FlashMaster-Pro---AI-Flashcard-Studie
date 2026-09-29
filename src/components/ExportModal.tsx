import React, { useState } from 'react';
import { Deck, Flashcard } from '../types/flashcard';
import {
  exportDeckToExcel,
  exportDeckToWord,
  exportDeckToAnki,
  exportDeckToQuizlet,
  exportDeckToJson,
  generateQuizletText,
  exportDeckToPrintablePdf,
  PdfPrintMode,
  exportStandaloneDigitalPlayer,
  exportStandaloneWindowsPackage,
  exportStandaloneMacApp,
  exportStandaloneRaspberryPiApp,
} from '../utils/fileExporters';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Copy,
  Check,
  Monitor,
  Apple,
  Cpu,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';

interface ExportModalProps {
  deck: Deck;
  cards: Flashcard[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ deck, cards, onClose }) => {
  const [copiedQuizlet, setCopiedQuizlet] = useState(false);
  const [pdfMode, setPdfMode] = useState<PdfPrintMode>('study_cards');
  const deckCards = deck.id === 'all' ? cards : cards.filter((c) => c.deckId === deck.id);

  const handleCopyQuizlet = () => {
    const text = generateQuizletText(deck, cards);
    navigator.clipboard.writeText(text);
    setCopiedQuizlet(true);
    setTimeout(() => setCopiedQuizlet(false), 2500);
  };

  const handlePrintPdf = () => {
    exportDeckToPrintablePdf(deck, cards, pdfMode);
  };

  const handleExportDigitalPlayer = () => {
    exportStandaloneDigitalPlayer(deck, cards);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Download className="w-6 h-6 text-indigo-400" />
              Eksporter & Send ut Flashcards
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Kortsett: <strong className="text-slate-200">&ldquo;{deck.title}&rdquo;</strong> ({deckCards.length} kort) &bull; Alle referanser i APA 7
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Featured Plug & Play Digital Export for Mac & Windows */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/50 via-indigo-950/40 to-slate-900 border border-sky-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sky-300 font-bold text-base">
              <Monitor className="w-5 h-5 text-sky-400" />
              <span>Digital Interaktiv Spiller (Mac & Windows Plug & Play)</span>
            </div>
            <span className="text-[11px] bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded-full border border-sky-500/30">
              100% Frakoblet &bull; Uten program
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Eksporterer en komplett, frittstående interaktiv kortspiller med alle {deckCards.length} kort. Fungerer sømløst og direkte på Mac (Safari/Chrome) og Windows (Edge/Chrome/Firefox) med et enkelt dobbeltklikk. Krever verken installasjon, server eller terminal. Inkluderer stemmeopplesning (TTS), vendingsanimasjon, valgfri vanskelighetsgrad og APA 7 referanser.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={() => exportStandaloneWindowsPackage(deck, cards)}
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              title="Last ned for Windows med .bat dobbelklikk-starter"
            >
              <Monitor className="w-3.5 h-3.5" />
              Windows (.bat + .html)
            </button>
            <button
              onClick={() => exportStandaloneMacApp(deck, cards)}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              title="Last ned for macOS med .command dobbelklikk-starter"
            >
              <Apple className="w-3.5 h-3.5" />
              macOS (.command + .html)
            </button>
            <button
              onClick={() => exportStandaloneRaspberryPiApp(deck, cards)}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              title="Last ned for Raspberry Pi & Linux med .sh-starter"
            >
              <Cpu className="w-3.5 h-3.5" />
              Raspberry Pi & Linux (.sh)
            </button>
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. PDF & Print */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-rose-500/50 transition-all flex flex-col justify-between space-y-3 sm:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                  <Printer className="w-5 h-5" />
                  <span>Utskriftsvennlig PDF & Print Layout (5 Formater)</span>
                </div>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded">
                  {deckCards.length} kort
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Velg ønsket papirformat. Referanser vises kun på baksiden. Kontrollerte sideskift uten oppkuttede kort.
              </p>
            </div>

            {/* 5 PDF Mode Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { id: 'study_cards', label: '1. Studiekort', desc: 'Brettbart / klassisk' },
                { id: 'print_cut', label: '2. Print & Cut', desc: 'Tosidig speilet' },
                { id: 'compact', label: '3. Kompakt', desc: 'Spar papir & blekk' },
                { id: 'full_size', label: '4. Full Size', desc: 'Store premium-kort' },
                { id: 'booklet', label: '5. Studiehefte', desc: 'Tema-kompendium' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPdfMode(m.id as PdfPrintMode)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    pdfMode === m.id
                      ? 'bg-rose-950/70 border-rose-500 text-rose-100 shadow-md shadow-rose-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">{m.label}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handlePrintPdf}
              className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25"
            >
              <Printer className="w-3.5 h-3.5" />
              Skriv ut / Generer PDF i valgt format ({deckCards.length} kort)
            </button>
          </div>

          {/* 2. Anki Export */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1.5 text-base">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs">
                  🗃️
                </span>
                Anki (.txt)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Tab-separert fil med ren forside (ingen referanse avslørt) og bakside med korrekt svar og APA 7 kildehenvisning.
              </p>
            </div>

            <button
              onClick={() => exportDeckToAnki(deck, cards)}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Last ned Anki-fil
            </button>
          </div>

          {/* 3. Excel (.xlsx) */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5 text-base">
                <FileSpreadsheet className="w-5 h-5" />
                Excel (.xlsx)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Strukturert regneark med Kort-ID, forside, bakside, APA 7 referanser, repetisjonsdata og emner.
              </p>
            </div>

            <button
              onClick={() => exportDeckToExcel(deck, cards)}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Last ned Excel-fil (.xlsx)
            </button>
          </div>

          {/* 4. Word (.doc) */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold mb-1.5 text-base">
                <FileText className="w-5 h-5" />
                Word (.doc)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Formaterte kort og kompendium som åpnes direkte i Microsoft Word eller Google Docs for videre notater.
              </p>
            </div>

            <button
              onClick={() => exportDeckToWord(deck, cards)}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Last ned Word-dokument (.doc)
            </button>
          </div>

          {/* 5. Quizlet */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-sky-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sky-400 font-bold mb-1.5 text-base">
                <span className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-xs">
                  ⚡
                </span>
                Quizlet
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Kopier termer og svar direkte inn i Quizlets importfunksjon.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyQuizlet}
                className="flex-1 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {copiedQuizlet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedQuizlet ? 'Kopiert!' : 'Kopier for Quizlet'}
              </button>

              <button
                onClick={() => exportDeckToQuizlet(deck, cards)}
                title="Last ned .txt"
                className="px-3 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 6. Full JSON Backup */}
          <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-1.5 text-base">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs">
                  🔒
                </span>
                JSON Backup (Frakoblet)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                100% lokal sikkerhetskopi av alle kort, framgang og boksfordeling.
              </p>
            </div>

            <button
              onClick={() => exportDeckToJson(deck, cards)}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Last ned JSON-backup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
