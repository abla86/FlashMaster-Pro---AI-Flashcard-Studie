import React, { useState } from 'react';
import { StudyContentItem, StudyContentType } from '../types/flashcard';
import { loadStudyContent } from '../utils/studyContentStorage';
import {
  BookOpen,
  FileCheck2,
  FileSpreadsheet,
  Stethoscope,
  Microscope,
  Brain,
  Search,
  Filter,
  Download,
  Copy,
  Check,
} from 'lucide-react';

export const StudyContentView: React.FC = () => {
  const [items, setItems] = useState<StudyContentItem[]>(loadStudyContent());
  const [selectedType, setSelectedType] = useState<StudyContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<StudyContentItem | null>(items[0] || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const matchType = selectedType === 'all' || item.type === selectedType;
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: StudyContentType) => {
    switch (type) {
      case 'arbeidsark':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'sjekkliste':
        return <FileCheck2 className="w-4 h-4 text-sky-400" />;
      case 'lesestoff':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'case':
        return <Stethoscope className="w-4 h-4 text-rose-400" />;
      case 'forskningsmetode':
        return <Microscope className="w-4 h-4 text-indigo-400" />;
      case 'refleksjon':
        return <Brain className="w-4 h-4 text-purple-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Faglig Dokumentinnhold & Læringsressurser</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Studieinnhold & Arbeidsark
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Ikke alt materiale blir flashcards. Her bevares pensumtekster, kliniske sjekklister, PICO-forskningsmatriser, formelark og case-scenarier direkte fra dine dokumenter.
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-white">{items.length}</span>
          <span className="text-xs text-slate-400 block font-medium">Læringselementer</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i arbeidsark, sjekklister og lesestoff..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'Alle' },
              { id: 'arbeidsark', label: 'Arbeidsark' },
              { id: 'sjekkliste', label: 'Sjekklister' },
              { id: 'lesestoff', label: 'Lesestoff' },
              { id: 'case', label: 'Kasus' },
              { id: 'forskningsmetode', label: 'Metode/PICO' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Split: List + Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Element List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              Ingen studieelementer matcher søket.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  selectedItem?.id === item.id
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-900/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                    {getTypeIcon(item.type)}
                    {item.type}
                  </span>
                  <span>{item.category}</span>
                </div>

                <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.content}</p>

                <div className="text-[10px] text-slate-500 font-mono">
                  Kilde: {item.sourceFile}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Full Document Reader */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 flex flex-col justify-between">
          {selectedItem ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      {getTypeIcon(selectedItem.type)}
                      {selectedItem.category} &bull; {selectedItem.type}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {selectedItem.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy(selectedItem.id, selectedItem.content)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                    title="Kopier tekst"
                  >
                    {copiedId === selectedItem.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedId === selectedItem.id ? 'Kopiert' : 'Kopier'}</span>
                  </button>
                </div>

                <div className="prose prose-invert max-w-none text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
                  {selectedItem.content}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-500">
                <span>
                  Dokumentkilde: <strong className="text-slate-400">{selectedItem.sourceFile}</strong>
                  {selectedItem.sourceSection && ` &bull; Seksjon: ${selectedItem.sourceSection}`}
                </span>
                <span className="font-mono">100% Kildetro</span>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Velg et studieelement til venstre for å lese innholdet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
