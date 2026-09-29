import React, { useState } from 'react';
import { Deck, CardDesignFamily } from '../types/flashcard';
import { FolderPlus } from 'lucide-react';

interface NewDeckModalProps {
  onClose: () => void;
  onSave: (deck: Deck) => void;
}

export const NewDeckModal: React.FC<NewDeckModalProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [defaultDesign, setDefaultDesign] = useState<CardDesignFamily>('Nordic');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vennligst oppgi en tittel på kortsettet.');
      return;
    }

    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
      defaultDesign,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceType: 'manual',
    };

    onSave(newDeck);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            Opprett Nytt Kortsett
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Kortsett-tittel *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks: Organisk Kjemi, Norsk Lovgivning..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Beskrivelse (valgfritt)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hva handler dette settet om?"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Emneknagger (kommaseparert)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Fag, Eksamen, H26"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Standard designstil
            </label>
            <select
              value={defaultDesign}
              onChange={(e) => setDefaultDesign(e.target.value as CardDesignFamily)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
            >
              <option value="Nordic">Nordic (Slate & Isblå)</option>
              <option value="Clinical">Clinical (Medisinsk/Akutt)</option>
              <option value="Academic">Academic (Klassisk serif & Pergament)</option>
              <option value="Process">Process (Trinnvis & Flyt)</option>
              <option value="Formula">Formula (Arkitekt/Formel)</option>
              <option value="Minimal">Minimal (Ren monokrom)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/30"
            >
              Opprett kortsett
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
