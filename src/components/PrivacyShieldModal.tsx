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
import { clearLocalAppData } from '../utils/storage';

interface PrivacyShieldModalProps {
  isOfflineOnly: boolean;
  onToggleOffline: (enabled: boolean) => void;
  onClose: () => void;
  onPurgeData: () => void;
}

export const PrivacyShieldModal: React.FC<PrivacyShieldModalProps> = ({
  isOfflineOnly,
  onToggleOffline,
  onClose,
  onPurgeData,
}) => {
  const handlePurge = async () => {
    if (
      window.confirm(
        'Slette appens lokale nettleserdata, inkludert egendefinerte kort/kortsett, statistikk, importert innhold og lokale preferanser for frakoblet-modus, tema og autosave? Den innebygde masterbanken i app-pakken blir ikke slettet. Dette fjerner lokale kopier fra denne nettleserprofilen, men garanterer ikke overskriving av lagringsmediet eller sletting av kopier hos andre tjenester.'
      )
    ) {
      void clearLocalAppData().then(() => {
        onPurgeData();
        onClose();
      }).catch(() => {
        window.alert('Kunne ikke slette alle lokale data. Prøv igjen, og kontroller nettleserens lagringstillatelser.');
      });
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
              Informasjon om lokal lagring, nettverksbruk og begrensninger
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
              Lokal studiepreferanse
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Dette valget kan styre støttede AI-funksjoner i appen, men er ikke en nettverksbrannmur og blokkerer ikke all trafikk. Tilgangskontroll og enkelte funksjoner kan kontakte serveren. For reell frakobling må enheten være uten nettverk.
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
                Kortsett og statistikk lagres i nettleserens LocalStorage/IndexedDB. Dataene er ikke kryptert av appen; skript med samme opprinnelse og tilgang til nettleserprofilen kan potensielt lese dem.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-sky-400" />
                Sanitering mot kodeinjeksjon
              </div>
              <p className="text-slate-400 leading-relaxed">
                Importen parser støttede filformater og enkelte felt valideres. Dette er ikke en fullstendig malware-skanner eller garanti mot XSS, farlige formler eller skadelige dokumenter.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-purple-400" />
                Ingen innebygd analysetjeneste
              </div>
              <p className="text-slate-400 leading-relaxed">
                Appen er ikke ment å bruke analyseverktøy eller sporingspiksler. Nettleserutvidelser, hosting, betaling og eksterne AI-tjenester kan likevel behandle tekniske data; kontroller nettverkskall og leverandørvilkår for den aktuelle utrullingen.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                Kryptert TLS-transport
              </div>
              <p className="text-slate-400 leading-relaxed">
                Transportbeskyttelse avhenger av HTTPS/TLS i den konkrete utrullingen. Kontroller at appen og API-et bruker HTTPS før du sender data.
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
            Slett egendefinerte lokale data
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
