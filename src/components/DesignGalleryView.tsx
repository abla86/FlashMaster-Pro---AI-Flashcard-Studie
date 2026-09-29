import React, { useState } from 'react';
import { CardDesignFamily, Flashcard } from '../types/flashcard';
import { CardVisual } from './CardVisual';
import { Palette, Sparkles, Check, Search } from 'lucide-react';

interface DesignGalleryViewProps {
  sampleCard: Flashcard;
  onSelectDesign?: (design: CardDesignFamily) => void;
}

export const ALL_32_DESIGNS: Array<{
  id: CardDesignFamily;
  name: string;
  category: string;
  description: string;
}> = [
  { id: 'Clinical', name: 'Clinical', category: 'Medisin', description: 'Ren, presis sykehus- og pasientlayout med diskrete akuttmarkører.' },
  { id: 'Nordic', name: 'Nordic', category: 'Naturvitenskap', description: 'Skandinavisk minimalisme med dype kjølige blåtoner og skarp typografi.' },
  { id: 'Dark Premium', name: 'Dark Premium', category: 'Generelt', description: 'Eksklusiv mørk obsidian-look med subtile neonlys og høy kontrast.' },
  { id: 'Light Premium', name: 'Light Premium', category: 'Generelt', description: 'Lys, elegant og papirlignende bakgrunn for daglesing.' },
  { id: 'Minimal', name: 'Minimal', category: 'Kjernebegrep', description: 'Ingen støy, ren typografi for rask repetisjon og definisjoner.' },
  { id: 'Academic', name: 'Academic', category: 'Jus & Samfunn', description: 'Serif-typografi for lovverk, rettsavgjørelser og historiske kilder.' },
  { id: 'Anatomy', name: 'Anatomy', category: 'Medisin', description: 'Optimalisert for anatomiske strukturer, organer og sirkulasjon.' },
  { id: 'Emergency', name: 'Emergency', category: 'Akuttmedisin', description: 'Høykontrast rød/amber for ABCDE, STEMI, anafylaksi og akutte tiltak.' },
  { id: 'Medication', name: 'Medication', category: 'Farmakologi', description: 'Spesialdesign for doser, styrker, volum, indikasjoner og antidoter.' },
  { id: 'Case', name: 'Case / Kasus', category: 'Klinisk praksis', description: 'Strukturert for pasientpresentasjoner, symptomer og differensialdiagnoser.' },
  { id: 'Exam', name: 'Exam / Eksamen', category: 'Dyp læring', description: 'Fokusert på skåringskriterier, sensorveiledning og mekanismer.' },
  { id: 'Research', name: 'Research / PICO', category: 'Forskningsmetode', description: 'For PICO, evidenshierarki, RCT, litteraturoversikter og p-verdier.' },
  { id: 'Timeline', name: 'Timeline', category: 'Prosess', description: 'Kronologiske hendelser, historikk og trinnvis pasientforløp.' },
  { id: 'Process', name: 'Process / Algoritme', category: 'Teknologi', description: 'Steg-for-steg beslutningstrær og logiske kjeder.' },
  { id: 'Comparison', name: 'Comparison', category: 'Differensial', description: 'Side-om-side sammenligning for å skille diagnoser eller metoder.' },
  { id: 'Decision Tree', name: 'Decision Tree', category: 'Algoritme', description: 'Hvis/så-logikk for akutte kliniske retningslinjer.' },
  { id: 'Diagram', name: 'Diagram / Skjema', category: 'Visuell', description: 'Vektorbassert layout tilpasset diagrammer og kurver.' },
  { id: 'Image First', name: 'Image First', category: 'Visuell', description: 'Stort bilde/SVG i sentrum for visuell gjenkjenning.' },
  { id: 'Memory', name: 'Memory', category: 'Mnemoteknikk', description: 'Fokus på akronymer (FAST, ABCDE, MONA) og huskeregler.' },
  { id: 'Premium', name: 'Premium', category: 'Eksklusiv', description: 'Gull- og smaragdtoner for nøkkeloppsummeringer.' },
  { id: 'Formula', name: 'Formula / Formel', category: 'Matematikk', description: 'For legemiddelregning, fysikk og matematiske formler.' },
  { id: 'Definition', name: 'Definition', category: 'Språk', description: 'Ordbok-oppsett med etymologi og kjernebegrep.' },
  { id: 'Modern', name: 'Modern', category: 'Teknologi', description: 'Strømlinjeformet tech-estetikk med ren sans-serif.' },
  { id: 'Glass', name: 'Glassmorphism', category: 'Visuell', description: 'Gjennomsiktig frostet glass med subtile lysrefleksjoner.' },
  { id: 'Case Study', name: 'Case Study', category: 'Klinisk praksis', description: 'Dyptgående pasientforløp med tidskritiske intervensjoner.' },
  { id: 'Memory Palace', name: 'Memory Palace', category: 'Mnemoteknikk', description: 'Visuell romlig knagg for kompleks memorering.' },
  { id: 'Editorial', name: 'Editorial', category: 'Tidsskrift', description: 'Artikkelstil inspirert av vitenskapelige tidsskrifter.' },
  { id: 'High Contrast', name: 'High Contrast', category: 'Tilgjengelighet', description: 'Maksimal lesbarhet med sort bakgrunn og skarp hvit/gul skrift.' },
  { id: 'Quick Recall', name: 'Quick Recall', category: 'Hurtig', description: 'Ultrakonsis layout for lynrask repetisjon.' },
  { id: 'Deep Recall', name: 'Deep Recall', category: 'Dyp læring', description: 'Krever utfyllende begrunnelse og mekanismeforståelse.' },
  { id: 'Scenario', name: 'Scenario', category: 'Klinisk praksis', description: '"Hva gjør du nå?" – praktisk situasjonshåndtering.' },
  { id: 'Microbiology', name: 'Microbiology', category: 'Biologi', description: 'Mikrobiologisk layout for bakterier, virus og resistens.' },
  { id: 'Psychology', name: 'Psychology', category: 'Helsefag', description: 'Psykologi, kognitive modeller og kommunikasjon.' },
  { id: 'Reflection', name: 'Reflection', category: 'Etikk', description: 'Etiske dilemmaer og faglig refleksjon.' },
  { id: 'Premium Academic', name: 'Premium Academic', category: 'Akademisk', description: 'Klassisk universitetsstil med dyp rødbrun og pergamentdetaljer.' },
];

export const DesignGalleryView: React.FC<DesignGalleryViewProps> = ({
  sampleCard,
  onSelectDesign,
}) => {
  const [selectedDesign, setSelectedDesign] = useState<CardDesignFamily>('Clinical');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = Array.from(new Set(ALL_32_DESIGNS.map((d) => d.category)));

  const filteredDesigns = ALL_32_DESIGNS.filter((d) => {
    const matchCategory = activeCategory === 'all' || d.category === activeCategory;
    const matchSearch =
      !searchQuery.trim() ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const previewCard: Flashcard = {
    ...sampleCard,
    design: selectedDesign,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            <span>FlashForge Design Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            32 Profesjonelle Kortdesign
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Design velges automatisk etter fagområde og innhold, men du kan tilpasse stilen til ethvert kortsett for optimal visuell læring og variasjon.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-white">{ALL_32_DESIGNS.length}</span>
          <span className="text-xs text-slate-400 font-medium">Tilgjengelige design</span>
        </div>
      </div>

      {/* Main Split: Live Interactive Card on Top/Left, Catalog below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Sticky Live Preview */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Direkte Forhåndsvisning:</span>
            <span className="text-sky-400 font-mono font-bold">{selectedDesign}</span>
          </div>

          <div className="rounded-3xl shadow-2xl overflow-hidden">
            <CardVisual card={previewCard} interactive={true} />
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1 text-center">
            <span className="text-white font-bold block">
              {ALL_32_DESIGNS.find((d) => d.id === selectedDesign)?.name}
            </span>
            <p>{ALL_32_DESIGNS.find((d) => d.id === selectedDesign)?.description}</p>
          </div>
        </div>

        {/* Right: Design Selection Grid */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Categories */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk i 32 designstiler..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Alle
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of designs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredDesigns.map((des) => (
              <div
                key={des.id}
                onClick={() => {
                  setSelectedDesign(des.id);
                  if (onSelectDesign) onSelectDesign(des.id);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                  selectedDesign === des.id
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-900/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {des.name}
                    {selectedDesign === des.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded">
                    {des.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {des.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
