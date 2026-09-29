import React from 'react';
import {
  ShieldCheck,
  Lock,
  WifiOff,
  Database,
  Trash2,
  FileCheck,
  CheckCircle2,
  EyeOff,
} from 'lucide-react';
import { purgeAllDataSecurely } from '../utils/storage';

interface PrivacyShieldModalProps {
  isOfflineOnly: boolean;
  onToggleOffline: (enabled: boolean) => void;
  onClose: () => void;
  onResetData: () => void;
}

export const PrivacyShieldModal: React.FC<PrivacyShieldModalProps> = ({
  isOfflineOnly,
  onToggleOffline,
  onClose,
  onResetData,
}) => {
  const handlePurge = () => {
    if (
      window.confirm(
        'Er du helt sikker på at du vil slette all lokal data? Dette sletter alle kortsett, kort og statistikk fra nettleseren din permanent.'
      )
    ) {
      purgeAllDataSecurely();
      onResetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Personvern & Sikkerhetsskjold
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Garantert beskyttelse mot informasjonslekkasje, datainnbrudd og sporing
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Offline Toggle Switch */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-base font-bold text-white flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-indigo-400" />
              100% Frakoblet Sikkerhetsmodus (Offline Only)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Når aktivert, blokkeres all ekstern nettverkstrafikk. Alle Excel-filer, PDF-er og kort analyseres utelukkende lokalt i nettleseren din.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleOffline(!isOfflineOnly)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
              isOfflineOnly ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-md transition-transform" />
          </button>
        </div>

        {/* Security Pillars */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sikkerhetsarkitektur
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                Lokal lagring i nettleseren
              </div>
              <p className="text-slate-400 leading-relaxed">
                Kortsettene dine lagres i din lokale nettleser (LocalStorage / IndexedDB). Ingen tredjeparter har tilgang.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-sky-400" />
                Sanitering mot kodeinjeksjon
              </div>
              <p className="text-slate-400 leading-relaxed">
                Alle importerte Excel- og Word-dokumenter vaskes automatisk for ondsinnet JavaScript eller formler (anti-XSS).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-purple-400" />
                Null sporing eller telemetri
              </div>
              <p className="text-slate-400 leading-relaxed">
                Ingen analyseverktøy, informasjonskapsler eller eksterne sporingspiksler er installert.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                Kryptert TLS-transport
              </div>
              <p className="text-slate-400 leading-relaxed">
                Når AI-funksjoner benyttes, skjer all kommunikasjon med API-et over krypterte server-til-server kanaler.
              </p>
            </div>
          </div>
        </div>

        {/* Secure Wipe Action */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePurge}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Sikker sletting av alle data
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
