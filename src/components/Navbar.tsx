import React from 'react';
import {
  Layers,
  Upload,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Plus,
  Palette,
  Sun,
  Moon,
  Target,
  FileText,
  Sliders,
  Zap,
  Activity,
  Download,
  HelpCircle,
} from 'lucide-react';

export type AppNavView =
  | 'dashboard'
  | 'decks'
  | 'import'
  | 'documents'
  | 'content'
  | 'cards'
  | 'generator'
  | 'design'
  | 'study'
  | 'plan'
  | 'stats'
  | 'export'
  | 'settings'
  | 'job';

interface NavbarProps {
  activeView: AppNavView;
  onNavigate: (view: AppNavView) => void;
  onOpenGenerateAll?: () => void;
  onOpenThreeProposals: () => void;
  onOpenImport: () => void;
  onOpenStats: () => void;
  onOpenSettings?: () => void;
  onOpenPrivacy?: () => void;
  onOpenNewCard?: () => void;
  onOpenExportModal?: () => void;
  isOfflineOnly: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  totalCardsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onOpenGenerateAll,
  onOpenThreeProposals,
  onOpenImport,
  onOpenStats,
  onOpenSettings,
  onOpenNewCard,
  onOpenExportModal,
  isOfflineOnly,
  isDarkMode,
  onToggleDarkMode,
  totalCardsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap lg:flex-nowrap">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-amber-400 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0f17] rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-sky-400" />
              </div>
            </div>

            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                FlashForge <span className="text-sky-400">Pro</span>
              </div>
              <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase hidden sm:block">
                Dokument- & Kunnskapsmotor
              </div>
            </div>
          </div>

          {/* Core Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => onNavigate('documents')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'documents' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dokumenter
            </button>

            <button
              onClick={() => onNavigate('content')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'content' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Studieinnhold
            </button>

            <button
              onClick={() => onNavigate('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kortbibliotek
            </button>

            <button
              onClick={() => onNavigate('plan')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'plan' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Studieplan
            </button>

            <button
              onClick={() => onNavigate('design')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'design' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Design (32)
            </button>
          </nav>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* GENERER ALT Button */}
          {onOpenGenerateAll && (
            <button
              onClick={onOpenGenerateAll}
              title="Kjør hele pipeline: Import, validering, alle originalkort, varianter, design og eksport"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md shadow-rose-600/25 hover:opacity-95 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>GENERER ALT</span>
            </button>
          )}

          {/* 3 Forslag Generator */}
          <button
            onClick={onOpenThreeProposals}
            title="Generer 3 distinkte faglige perspektiver (Definisjon, Case, Dyp forståelse)"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 hover:text-white border border-amber-500/30 transition-all"
          >
            <span>⚡ 3 Forslag</span>
          </button>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer fil</span>
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Eksport</span>
          </button>

          {/* Statistics Button */}
          <button
            onClick={onOpenStats}
            title="Læringsstatistikk og KPIer"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Statistikk</span>
          </button>

          {/* Settings / Desktop Download */}
          <button
            onClick={onOpenSettings}
            title="Innstillinger & Nedlasting for Windows, Mac og Raspberry Pi"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <Sliders className="w-4 h-4 text-sky-400" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
