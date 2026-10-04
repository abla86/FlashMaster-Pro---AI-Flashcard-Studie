import React, { useState, useEffect } from 'react';
import { Deck, Flashcard, StudyStats, CardDesignTheme } from './types/flashcard';
import {
  loadDecks,
  saveDecks,
  loadCards,
  saveCards,
  loadStats,
  saveStats,
  getOfflineShieldSetting,
  setOfflineShieldSetting,
  resetAllDataToDefault,
  hydrateFromIndexedDb,
} from './utils/storage';
import { Navbar, AppNavView } from './components/Navbar';
import { CardVisual } from './components/CardVisual';
import { CardLibraryView } from './components/CardLibraryView';
import { StudySession } from './components/StudySession';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { StatisticsModal } from './components/StatisticsModal';
import { CardEditorModal } from './components/CardEditorModal';
import { PrivacyShieldModal } from './components/PrivacyShieldModal';
import { NewDeckModal } from './components/NewDeckModal';
import { ThreeProposalsModal } from './components/ThreeProposalsModal';
import { SourceControlModal } from './components/SourceControlModal';
import { GenerateAllModal } from './components/GenerateAllModal';
import { DashboardView } from './components/DashboardView';
import { DesignGalleryView } from './components/DesignGalleryView';
import { StudyPlanView } from './components/StudyPlanView';
import { StudyContentView } from './components/StudyContentView';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { generateStandaloneWindowsApp } from './utils/generateAllPipeline';
import {
  Layers,
  BookOpen,
  Plus,
  Play,
  Upload,
  Download,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  Filter,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<StudyStats>(loadStats());

  // Views & navigation
  const [activeView, setActiveView] = useState<AppNavView>('dashboard');
  const [studyingDeckId, setStudyingDeckId] = useState<string | null>(null);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);
  const [exportDeck, setExportDeck] = useState<Deck | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isThreeProposalsOpen, setIsThreeProposalsOpen] = useState(false);
  const [isSourceControlOpen, setIsSourceControlOpen] = useState(false);
  const [isGenerateAllOpen, setIsGenerateAllOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeDesignTheme, setActiveDesignTheme] = useState<string>('auto');
  const [visibleCardCount, setVisibleCardCount] = useState(60);
  const [proStatus, setProStatus] = useState<'loading' | 'active' | 'locked'>('loading');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const reference = params.get('reference');
        if (params.get('purchase') === 'complete' && reference) {
          for (let attempt = 0; attempt < 8; attempt += 1) {
            const response = await fetch(`/api/vipps/status?reference=${encodeURIComponent(reference)}`, { credentials: 'include' });
            const data = await response.json();
            if (data.pro) {
              if (!cancelled) setProStatus('active');
              window.history.replaceState({}, '', '/');
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
        const response = await fetch('/api/pro/status', { credentials: 'include' });
        const data = await response.json();
        if (!cancelled) setProStatus(data.pro ? 'active' : 'locked');
      } catch {
        if (!cancelled) setProStatus('locked');
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  // Privacy & Offline
  const [isOfflineOnly, setIsOfflineOnly] = useState<boolean>(getOfflineShieldSetting());

  // Dark mode (default true)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Gallery filters
  const [galleryDeckFilter, setGalleryDeckFilter] = useState<string>('all');
  const [galleryDesignFilter, setGalleryDesignFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (proStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-2xl font-black">FLASHMASTER PRO</div>
          <div className="text-sm text-slate-400">Kontrollerer tilgang…</div>
        </div>
      </div>
    );
  }

  if (proStatus === 'locked') {
    return (
      <div className="min-h-screen bg-[#070b14] text-white px-6 py-16">
        <div className="max-w-3xl mx-auto rounded-3xl border border-slate-700 bg-slate-900/80 p-8 sm:p-12 text-center space-y-6">
          <div className="text-xs font-black tracking-[0.25em] text-indigo-300">FLASHMASTER PRO</div>
          <h1 className="text-4xl sm:text-5xl font-black">2104 flashcards + ditt eget flashcard-studio</h1>
          <p className="text-slate-300 leading-7">Få tilgang til masterbanken, egne kort og kortsett, import fra PDF/Word/Excel/CSV/tekst, spaced repetition og eksport til Anki/Quizlet.</p>
          <div className="text-4xl font-black">799 kr</div>
          <a href="/api/vipps/create-payment" className="inline-flex px-7 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black">Kjøp med Vipps</a>
          <p className="text-xs text-slate-500">Etter godkjent betaling aktiveres Pro automatisk.</p>
          <a href="/sales" className="block text-sm text-slate-400 hover:text-white">Se full produktinformasjon</a>
        </div>
      </div>
    );
  }

  // Initial load
  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const loaded = await hydrateFromIndexedDb();
      if (!active) return;
      setDecks(loaded.decks);
      setCards(loaded.cards);
      setStats(loaded.stats);
    };

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  // Update HTML class for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handlers for deck management
  const handleCreateDeck = (newDeck: Deck) => {
    const updated = [newDeck, ...decks];
    setDecks(updated);
    saveDecks(updated);
  };

  const handleDeleteDeck = (deckId: string) => {
    if (window.confirm('Er du sikker på at du vil slette dette kortsettet og alle tilhørende kort?')) {
      const updatedDecks = decks.filter((d) => d.id !== deckId);
      const updatedCards = cards.filter((c) => c.deckId !== deckId);
      setDecks(updatedDecks);
      setCards(updatedCards);
      saveDecks(updatedDecks);
      saveCards(updatedCards);
    }
  };

  const handleStartStudy = (deckId: string) => {
    setStudyingDeckId(deckId);
    setActiveView('study');
  };

  // Handlers for card management
  const handleSaveCard = (savedCard: Flashcard) => {
    const existingIndex = cards.findIndex((c) => c.id === savedCard.id);
    let updatedCards: Flashcard[];
    if (existingIndex >= 0) {
      updatedCards = cards.map((c) => (c.id === savedCard.id ? savedCard : c));
    } else {
      updatedCards = [savedCard, ...cards];
    }
    setCards(updatedCards);
    saveCards(updatedCards);
    setEditingCard(null);
    setIsNewCardModalOpen(false);
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = cards.filter((c) => c.id !== cardId);
    setCards(updatedCards);
    saveCards(updatedCards);
  };

  const handleToggleFavorite = (cardId: string) => {
    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, isFavorite: !c.isFavorite } : c
    );
    setCards(updatedCards);
    saveCards(updatedCards);
  };

  // Toggle offline shield
  const handleToggleOffline = (enabled: boolean) => {
    setIsOfflineOnly(enabled);
    setOfflineShieldSetting(enabled);
  };

  // Reset all to sample data
  const handleResetData = () => {
    resetAllDataToDefault();
    setDecks(loadDecks());
    setCards(loadCards());
    setStats(loadStats());
  };

  // Filter cards for the gallery
  const filteredCards = cards.filter((card) => {
    const matchesDeck = galleryDeckFilter === 'all' || card.deckId === galleryDeckFilter;
    const matchesDesign = galleryDesignFilter === 'all' || card.design === galleryDesignFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDeck && matchesDesign && matchesSearch;
  });

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        isDarkMode ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onOpenGenerateAll={() => setIsGenerateAllOpen(true)}
        onOpenThreeProposals={() => setIsThreeProposalsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenNewCard={() => setIsNewCardModalOpen(true)}
        onOpenExportModal={() => setExportDeck(decks[0] || { id: 'all', title: 'FlashForge Pro' })}
        isOfflineOnly={isOfflineOnly}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        totalCardsCount={cards.length}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* VIEW 1: STUDY SESSION */}
        {activeView === 'study' && studyingDeckId && (
          <StudySession
            deck={decks.find((d) => d.id === studyingDeckId) || decks[0]}
            cards={cards}
            onFinish={() => {
              setActiveView('decks');
              setStudyingDeckId(null);
              setStats(loadStats());
            }}
            onUpdateCards={(updated) => setCards(updated)}
            activeDesignTheme={activeDesignTheme}
          />
        )}

        {/* VIEW 2: DASHBOARD */}
        {activeView === 'dashboard' && (
          <DashboardView
            decks={decks}
            cards={cards}
            stats={stats}
            onNavigate={(view) => setActiveView(view)}
            onStartStudy={(deckId) => handleStartStudy(deckId || decks[0]?.id || 'default')}
            onReloadMasterbank={handleResetData}
            onOpenThreeProposals={() => setIsThreeProposalsOpen(true)}
            onOpenPipeline={() => setIsGenerateAllOpen(true)}
          />
        )}

        {/* VIEW 3: CARD LIBRARY (MODERN VIRTUALIZED FLASHCARD STUDIO) */}
        {activeView === 'cards' && (
          <CardLibraryView
            cards={cards}
            decks={decks}
            onOpenNewCard={() => setIsNewCardModalOpen(true)}
            onEditCard={(card) => setEditingCard(card)}
            onToggleFavorite={handleToggleFavorite}
            onStartStudyWithCards={(selected) => {
              setStudyingDeckId(selected[0]?.deckId || 'all');
              setActiveView('study');
            }}
            onOpenExportModal={(deck) => setExportDeck(deck)}
            globalDesignTheme={activeDesignTheme}
            onSelectDesignTheme={(theme) => setActiveDesignTheme(theme)}
          />
        )}

        {/* VIEW 4: 32 DESIGNS SHOWCASE */}
        {activeView === 'design' && (
          <DesignGalleryView
            sampleCard={cards[0] || ({
              id: 'FF-0001',
              deckId: '1',
              kategori: 'Medisin',
              emne: 'Kardiologi',
              korttype: 'Definisjon',
              niva: 'Middels',
              forside: 'Hva er definisjonen på ortostatisk blodtrykksfall?',
              bakside: 'Et fall i systolisk blodtrykk på minst 20 mmHg eller diastolisk blodtrykk på minst 10 mmHg innen 3 minutter etter overgang fra liggende til stående stilling.',
              referansehenvisning: 'Norsk Elektronisk Legehåndbok, 2024',
            } as any)}
            onSelectDesign={(design) => {
              setActiveDesignTheme(design);
              setActiveView('cards');
            }}
          />
        )}

        {/* VIEW 5: AUTOMATIC STUDY PLAN */}
        {activeView === 'plan' && (
          <StudyPlanView
            cards={cards}
            decks={decks}
            onStartStudy={(deckId) => handleStartStudy(deckId)}
          />
        )}

        {/* VIEW 6: STUDY CONTENT REPOSITORY */}
        {activeView === 'content' && <StudyContentView />}

        {/* VIEW 7: DOCUMENTS & SOURCE TRACEABILITY */}
        {activeView === 'documents' && (
          <div className="space-y-4">
            <DocumentViewerModal cards={cards} onClose={() => setActiveView('dashboard')} />
          </div>
        )}

        {/* VIEW 8: DECKS OVERVIEW */}
        {activeView === 'decks' && (
          <div className="space-y-8">
            {/* Hero / Quick Stats Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-sky-900/30 border border-slate-800 p-6 sm:p-8">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    FlashForge Engine &bull; FLASHFORGE_READY_MASTERBANK.xlsx &bull; 2104 Originalkort
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Profesjonelle Flashcards med 100% Kildeintegritet
                  </h1>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    Mottak og tolkning av Excel (.xlsx, .csv), Word (.docx) og PDF. Generer automatisk spørsmål, svar og referanser uten oppdikting, eller kjør hele FlashForge-pipelinen med ett klikk.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setIsGenerateAllOpen(true)}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-black text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>⚡ GENERER ALT</span>
                  </button>

                  <button
                    onClick={() => generateStandaloneWindowsApp(cards)}
                    title="Last ned standalone HTML-applikasjon for Windows som kjører 100% offline uten terminal eller installasjon"
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Windows Offline (.html)</span>
                  </button>

                  <button
                    onClick={() => setIsThreeProposalsOpen(true)}
                    className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>3 Forslag</span>
                  </button>

                  <button
                    onClick={() => setIsImportOpen(true)}
                    className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Motta Filer</span>
                  </button>

                  <button
                    onClick={() => setIsSourceControlOpen(true)}
                    className="px-3.5 py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Kildekontroll</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Decks Grid Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  Mine Kortsett ({decks.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klikk Start Studie for å øve med Spaced Repetition (Leitner 5-boks-system)
                </p>
              </div>

              <button
                onClick={() => setActiveView('cards')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>Vis alle {cards.length} kort i bibliotek</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Decks List / Cards */}
            {decks.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">Ingen kortsett opprettet enda</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Kom i gang ved å importere en Excel- eller Word-fil, eller gjenopprett forhåndslagde eksempelsett.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsImportOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
                  >
                    Importer fil
                  </button>
                  <button
                    onClick={handleResetData}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
                  >
                    Last inn eksempler
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => {
                  const deckCards = cards.filter((c) => c.deckId === deck.id);
                  const dueCards = deckCards.filter((c) => (c.srs?.dueDate || 0) <= Date.now()).length;

                  return (
                    <div
                      key={deck.id}
                      className="group rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-black/40 space-y-5"
                    >
                      {/* Deck Header */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 text-sky-300 border border-slate-700 uppercase font-semibold tracking-wider">
                            {deck.defaultDesign || 'Nordisk'}
                          </span>

                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            {deck.sourceType && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 uppercase">
                                {deck.sourceType}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                            {deck.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {deck.description || 'Ingen beskrivelse.'}
                          </p>
                        </div>

                        {/* Tags */}
                        {deck.tags && deck.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {deck.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Counter & Due Status */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{deckCards.length} flashcards</span>
                        </div>

                        <div>
                          {dueCards > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[11px]">
                              {dueCards} klar til repetisjon
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Oppdatert
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleStartStudy(deck.id)}
                          disabled={deckCards.length === 0}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start Studie
                        </button>

                        <button
                          onClick={() => setExportDeck(deck)}
                          title="Eksporter (Anki, Quizlet, Excel, Word, PDF)"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          title="Slett kortsett"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700 hover:border-rose-900"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 space-y-1">
        <div>
          FlashForge Pro &bull; Profesjonelt Flashcard Studio med 100% lokal sikkerhet og personvern.
        </div>
        <div>
          FLASHFORGE_READY_MASTERBANK.xlsx &bull; 2104 Originalkort &bull; Eksport til Anki, Quizlet, Excel, Word, PDF
        </div>
      </footer>

      {/* MODALS */}
      {isSettingsOpen && (
        <SettingsModal
          isOfflineOnly={isOfflineOnly}
          onToggleOffline={handleToggleOffline}
          onClose={() => setIsSettingsOpen(false)}
          onResetData={handleResetData}
          decks={decks}
          cards={cards}
        />
      )}
      {isGenerateAllOpen && (
        <GenerateAllModal
          onClose={() => setIsGenerateAllOpen(false)}
          onComplete={(newCards, newDecks) => {
            setCards(newCards);
            setDecks(newDecks);
            setStats(loadStats());
          }}
        />
      )}
      {isImportOpen && (
        <ImportModal
          decks={decks}
          cards={cards}
          onClose={() => setIsImportOpen(false)}
          onSuccess={(newDeckId) => {
            setIsImportOpen(false);
            setDecks(loadDecks());
            setCards(loadCards());
            setActiveView('decks');
          }}
        />
      )}

      {exportDeck && (
        <ExportModal
          deck={exportDeck}
          cards={cards}
          onClose={() => setExportDeck(null)}
        />
      )}

      {isStatsOpen && (
        <StatisticsModal
          stats={stats}
          cards={cards}
          decks={decks}
          onClose={() => setIsStatsOpen(false)}
        />
      )}

      {isPrivacyOpen && (
        <PrivacyShieldModal
          isOfflineOnly={isOfflineOnly}
          onToggleOffline={handleToggleOffline}
          onClose={() => setIsPrivacyOpen(false)}
          onResetData={handleResetData}
        />
      )}

      {(isNewCardModalOpen || editingCard) && (
        <CardEditorModal
          card={editingCard}
          deckId={decks[0]?.id || 'default'}
          decks={decks}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
          onClose={() => {
            setEditingCard(null);
            setIsNewCardModalOpen(false);
          }}
        />
      )}

      {isNewDeckOpen && (
        <NewDeckModal
          onClose={() => setIsNewDeckOpen(false)}
          onSave={handleCreateDeck}
        />
      )}

      {isThreeProposalsOpen && (
        <ThreeProposalsModal
          decks={decks}
          currentDeckId={decks[0]?.id || 'default'}
          isOfflineOnly={isOfflineOnly}
          onAddCard={(newCard) => {
            const updated = [newCard, ...cards];
            setCards(updated);
            saveCards(updated);
          }}
          onAddAllCards={(newCards) => {
            const updated = [...newCards, ...cards];
            setCards(updated);
            saveCards(updated);
          }}
          onClose={() => setIsThreeProposalsOpen(false)}
        />
      )}

      {isSourceControlOpen && (
        <SourceControlModal
          cards={cards}
          onUpdateCardStatus={(cardId, newStatus) => {
            const updated = cards.map((c) =>
              c.id === cardId ? { ...c, status: newStatus } : c
            );
            setCards(updated);
            saveCards(updated);
          }}
          onClose={() => setIsSourceControlOpen(false)}
        />
      )}
    </div>
  );
}
