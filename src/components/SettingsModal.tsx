import React, { useState } from 'react';
import { Deck, Flashcard } from '../types/flashcard';
import {
  exportStandaloneWindowsPackage,
  exportStandaloneMacApp,
  exportStandaloneRaspberryPiApp,
} from '../utils/fileExporters';
import {
  Monitor,
  Apple,
  Cpu,
  ShieldCheck,
  Download,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  isOfflineOnly: boolean;
  onToggleOffline: (enabled: boolean) => void;
  onClose: () => void;
  onResetData: () => void;
  decks: Deck[];
  cards: Flashcard[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOfflineOnly,
  onToggleOffline,
  onClose,
  onResetData,
  decks,
  cards,
}) => {
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const handleDownloadWindows = () => {
    exportStandaloneWindowsPackage(decks[0] || { id: 'all', title: 'FlashForge Pro' }, cards);
    setDownloadSuccessMsg('Windows-pakke lastet ned! Dobbeltklikk på HTML- eller BAT-filen for å kjøre.');
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleDownloadMac = () => {
    exportStandaloneMacApp(decks[0] || { id: 'all', title: 'FlashForge Pro' }, cards);
    setDownloadSuccessMsg('Mac-versjon lastet ned! Åpne HTML-filen i Safari eller Chrome.');
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleDownloadRaspberryPi = () => {
    exportStandaloneRaspberryPiApp(decks[0] || { id: 'all', title: 'FlashForge Pro' }, cards);
    setDownloadSuccessMsg('Raspberry Pi / Linux-versjon lastet ned! Åpne filen i Chromium.');
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sliders className="w-6 h-6 text-sky-400" />
              FlashForge Innstillinger & Nedlastbare Apper
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Nedlasting for Windows, Mac og Raspberry Pi &bull; 100% lokal sikkerhet &bull; Null abonnement
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {downloadSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
        )}

        {/* Section 1: Standalone Download Center */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Nedlastbar Frakoblet App (Installer &rarr; Åpne &rarr; Bruk)
          </div>
          <p className="text-xs text-slate-400">
            Ingen npm, terminal, Docker eller installasjon kreves. Appen pakkes med alle {cards.length} kort, full studiemodus og stemmeopplesning.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Windows */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/60 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Monitor className="w-5 h-5 text-sky-400" />
                  <span>Windows (Hoved OS)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Optimalisert for Windows 10/11 med Edge/Chrome og dobbelklikk .bat-starter.
                </p>
              </div>

              <button
                onClick={handleDownloadWindows}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Last ned for Windows</span>
              </button>
            </div>

            {/* Mac */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Apple className="w-5 h-5 text-indigo-400" />
                  <span>macOS</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Fungerer direkte i Safari og Chrome på Mac med VoiceOver / TTS.
                </p>
              </div>

              <button
                onClick={handleDownloadMac}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Last ned for Mac</span>
              </button>
            </div>

            {/* Raspberry Pi / Linux */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span>Raspberry Pi & Linux</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Superlett, minimalt minneforbruk, kjører i Chromium på Raspberry Pi OS.
                </p>
              </div>

              <button
                onClick={handleDownloadRaspberryPi}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Last ned for Linux/Pi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Offline Privacy Shield */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Personvern & Frakoblet Beskyttelse
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Frakoblet Læringsskjold</span>
              </div>
              <p className="text-xs text-slate-400">
                Blokkerer alle eksterne nettverkskall. All dokumentlesing, SVG-illustrering, repetisjon og lagring skjer utelukkende lokalt i nettleseren din.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={isOfflineOnly}
                onChange={(e) => onToggleOffline(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Section 3: Data Management */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            3. Databehandling & Gjenoppretting
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Nullstill til FLASHFORGE Masterbank</h4>
              <p className="text-xs text-slate-400">
                Gjenoppretter de 2 104 originale kortene og fjerner midlertidige data.
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Vil du nullstille og laste inn hele masterbanken på nytt?')) {
                  onResetData();
                  setDownloadSuccessMsg('Masterbanken på 2104 kort er gjenopprettet!');
                }
              }}
              className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Gjenopprett Masterbank</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
