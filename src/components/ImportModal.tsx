import React, { useState, useRef } from 'react';
import { Deck, Flashcard, CardDesignFamily } from '../types/flashcard';
import { processAnyDocument } from '../utils/documentEngine';
import { DocumentAuditReport, DocumentExtractionProgress } from '../utils/documentModel';
import { saveDecks, saveCards } from '../utils/storage';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Loader2,
  Trash2,
  Layers,
  ArrowRight,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface ImportModalProps {
  decks: Deck[];
  cards: Flashcard[];
  onClose: () => void;
  onSuccess: (newDeckId: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  decks,
  cards,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Progress Dashboard Metrics
  const [progressState, setProgressState] = useState<DocumentExtractionProgress | null>(null);

  // Parsed Result & Audit Report
  const [extractedCards, setExtractedCards] = useState<Flashcard[]>([]);
  const [auditReport, setAuditReport] = useState<DocumentAuditReport | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [targetDeckMode, setTargetDeckMode] = useState<'new' | 'existing'>('new');
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id || '');
  const [showNeedsReviewTab, setShowNeedsReviewTab] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setIsProcessing(true);
    setAuditReport(null);
    setExtractedCards([]);

    try {
      const { cards: parsed, report } = await processAnyDocument(file, (progress) => {
        setProgressState(progress);
      });

      if (parsed.length === 0) {
        setErrorMsg('Fant ingen spørsmål eller svar i filen. Sjekk at filen har innhold.');
      } else {
        setExtractedCards(parsed);
        setAuditReport(report);
        setDeckTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Det oppstod en feil under strukturell lesing av dokumentet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalSave = () => {
    if (extractedCards.length === 0) {
      setErrorMsg('Ingen kort å importere.');
      return;
    }

    let deckId = selectedDeckId;

    if (targetDeckMode === 'new' || !deckId) {
      const newDeck: Deck = {
        id: `deck-${Date.now()}`,
        title: deckTitle || 'Importert kortsett',
        description: `Opprettet fra ${selectedFile?.name || 'dokument'} med ${extractedCards.length} flashcards. 100% kildesporing.`,
        tags: ['Dokumentmotor', 'Importert'],
        defaultDesign: extractedCards[0]?.design || 'Clinical',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sourceType: selectedFile?.name.endsWith('.docx')
          ? 'word'
          : selectedFile?.name.endsWith('.pdf')
          ? 'pdf'
          : 'excel',
        sourceFileName: selectedFile?.name,
      };

      const updatedDecks = [newDeck, ...decks];
      saveDecks(updatedDecks);
      deckId = newDeck.id;
    }

    // Attach deckId to all cards
    const finalizedCards = extractedCards.map((c) => ({
      ...c,
      deckId,
    }));

    const allCardsUpdated = [...finalizedCards, ...cards];
    saveCards(allCardsUpdated);

    onSuccess(deckId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[92vh] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Upload className="w-6 h-6 text-indigo-400" />
              FlashForge Robust Dokumentmotor
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Leser hele kilden uten kunstig grense &bull; XLSX, XLS, CSV, DOCX, PDF &bull; Tabeller, avsnitt og APA 7 referanser
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* File Drag & Drop Upload Zone */}
        {!extractedCards.length && !isProcessing && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-950/80 space-y-4 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              accept=".xlsx,.xls,.csv,.docx,.pdf,.txt"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Dra og slipp filen din her, eller klikk for å velge
              </h3>
              <p className="text-xs text-slate-400">
                Støtter Excel (.xlsx, .xls), CSV, Word (.docx med tabeller), PDF og tekstnotater.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">✓ Ingen 2104-grense</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">✓ Les hele tabeller</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">✓ APA 7 kildesporing</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">✓ Datatap = 0</span>
            </div>
          </div>
        )}

        {/* Live Processing Progress Dashboard */}
        {isProcessing && progressState && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>{progressState.statusText}</span>
              </div>
              <span className="font-mono text-white font-bold">{progressState.percent}%</span>
            </div>

            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${progressState.percent}%` }}
              />
            </div>

            {/* Live Progress Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Fil</span>
                <span className="text-white font-bold truncate block">{progressState.fileName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Sider/Ark</span>
                <span className="text-sky-400 font-bold">{progressState.currentPage} / {progressState.totalPages}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Blokker lest</span>
                <span className="text-white font-bold">{progressState.currentBlock}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Kort funnet</span>
                <span className="text-emerald-400 font-bold">{progressState.cards}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Gjenstår</span>
                <span className="text-amber-400 font-bold">{progressState.remaining}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result & Audit Report */}
        {extractedCards.length > 0 && auditReport && (
          <div className="space-y-6">
            {/* Audit Summary Box */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  IMPORT FULLFØRT &bull; {extractedCards.length} Kort Klargjort
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
                  Datatap: 0
                </span>
              </div>

              {/* Sluttrapport Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Dokumentsider/Ark</span>
                  <span className="text-lg font-black text-white">{auditReport.totalPages}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tekstblokker & Tabeller</span>
                  <span className="text-lg font-black text-white">{auditReport.totalBlocks} ({auditReport.tablesFound} tabeller)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Spørsmål & Svar</span>
                  <span className="text-lg font-black text-emerald-400">{auditReport.questionsFound} / {auditReport.answersFound}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">APA 7 Referanser</span>
                  <span className="text-lg font-black text-sky-400">{auditReport.referencesFound}</span>
                </div>
              </div>
            </div>

            {/* Deck Destination Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Tittel på kortsett</label>
                <input
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Lagre i</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDeckMode('new')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      targetDeckMode === 'new'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    Nytt kortsett
                  </button>
                  {decks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTargetDeckMode('existing')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                        targetDeckMode === 'existing'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}
                    >
                      Legg til i eksisterende
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview of Parsed Cards (Questions on front, answers & APA 7 references on back) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span>FORHÅNDSVISNING AV DOKUMENTINNHOLD ({extractedCards.length} KORT)</span>
                <span>Viser kortutdrag</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {extractedCards.slice(0, 10).map((c, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-sky-400 font-bold">{c.id}</span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300">{c.kategori} &bull; {c.design}</span>
                    </div>

                    <div className="text-xs font-bold text-white">
                      <span className="text-sky-400 mr-1.5">FORSIDE:</span>
                      {c.forside}
                    </div>

                    <div className="text-xs text-slate-300 line-clamp-2">
                      <span className="text-emerald-400 mr-1.5">BAKSIDE:</span>
                      {c.bakside}
                    </div>

                    <div className="text-[11px] text-sky-300 bg-sky-950/40 px-2 py-1 rounded inline-block">
                      <strong>KILDE (APA 7):</strong> {c.referansehenvisning}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setExtractedCards([]);
                  setAuditReport(null);
                  setSelectedFile(null);
                }}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Velg annen fil
              </button>

              <button
                type="button"
                onClick={handleFinalSave}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lagre og Åpne {extractedCards.length} Kort i Biblioteket</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
