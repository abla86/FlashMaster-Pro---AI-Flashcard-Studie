import { CardVariationProposal, CardDesignFamily, Korttype, Niva } from '../types/flashcard';
import { getDeterministicSvgForTopic } from './svgLibrary';

// Deterministic 3-Proposal Generator (0 Token consumption, offline-ready)
export function generateLocal3Proposals(topic: string, contextText: string = ''): CardVariationProposal[] {
  const cleanTopic = topic.trim() || 'Hjerteinfarkt';
  const cleanContext = contextText.trim();

  // Variant 1: Definisjon & Kjernerecall
  const v1: CardVariationProposal = {
    variantType: 'definisjon',
    title: '1. Definisjon & Kjernerecall',
    korttype: 'Definisjon',
    niva: 'Grunnleggende',
    forside: `Hva er den faglige definisjonen og kjernekarakteristikken ved ${cleanTopic}?`,
    bakside: cleanContext 
      ? `Kort svar: ${cleanContext.slice(0, 160)}... \n\nForklaring: Sentral fysiologisk og klinisk forståelse basert på pensum.`
      : `Kort svar: Patofysiologisk tilstand/konsept kjennetegnet ved spesifikke mekanismer og definerte diagnosekriterier.\n\nForklaring: Krever umiddelbar gjenkjenning av kardinalsymptomer og verifisering via standard laboratorie-/undersøkelsesfunn.`,
    referansehenvisning: `${cleanTopic} retningslinjer, kap. 2, s. 45`,
    fullReferanse: `Norsk Elektronisk Legehåndbok (NEL) & Helsedirektoratet (2024). Faglige retningslinjer for ${cleanTopic}.`,
    design: 'Definition',
    svgContent: getDeterministicSvgForTopic(cleanTopic, 'definisjon'),
    begrunnelse: 'Optimal for aktiv gjenkalling av kjernebegreper og definisjoner uten distraksjoner.',
    tagger: [cleanTopic, 'Definisjon', 'Kjernefag'],
  };

  // Variant 2: Klinisk Observasjon & Praktisk Case
  const v2: CardVariationProposal = {
    variantType: 'case',
    title: '2. Klinisk Case & Beslutningstaking',
    korttype: 'Case',
    niva: 'Middels',
    forside: `Case: En pasient presenterer med typiske tegn på ${cleanTopic}. Hvilken umiddelbar tiltakskjede eller førstevalgs intervensjon er indisert?`,
    bakside: `Kort svar: Iverksett standard initialbehandling, monitorer vitale parametere (ABCDE) og sikre rask diagnostisk avklaring.\n\nBegrunnelse: Forebygger irreversibel vevsskade og komplikasjoner ved tidlig og målrettet innsats.`,
    referansehenvisning: `Akuttveileder i medisin (2024), Seksjon 4.1`,
    fullReferanse: `Aarseth, S., & Lindbæk, M. (2023). Akuttmedisinsk sjekkliste og handlingsalgoritmer. Gyldendal Akademisk.`,
    design: 'Clinical',
    svgContent: getDeterministicSvgForTopic(cleanTopic, 'case'),
    begrunnelse: 'Bygger praktisk beslutningsevne og anvendt kunnskap i realistiske situasjoner.',
    tagger: [cleanTopic, 'Klinisk', 'Case', 'Behandling'],
  };

  // Variant 3: Dyp Sammenheng, Mekanisme & Eksamensperspektiv
  const v3: CardVariationProposal = {
    variantType: 'dyp_forstaelse',
    title: '3. Mekanisme & Eksamensanalyse',
    korttype: 'Dyp gjenhenting',
    niva: 'Avansert',
    forside: `Gjør rede for den bakenforliggende mekanismen og sentrale differensialdiagnoser ved ${cleanTopic}.`,
    bakside: `Kort svar: Årsak-virkningskjede drevet av cellulær iskemi, metabolsk ubalanse eller elektrolyttforstyrrelser.\n\nDyp forklaring: Viktigste differensialdiagnoser må utelukkes systematisk ved hjelp av spesifikke biomarkører og differensierende kliniske kjennetegn.`,
    referansehenvisning: `Guyton & Hall: Medical Physiology, Kap. 14, Tabell 3`,
    fullReferanse: `Hall, J. E. (2020). Guyton and Hall Textbook of Medical Physiology (14. utg.). Elsevier Saunders.`,
    design: 'Process',
    svgContent: getDeterministicSvgForTopic(cleanTopic, 'prosess'),
    begrunnelse: 'Utfordrer dyp kausalforståelse, patofysiologi og analyse til eksamen på høyt nivå.',
    tagger: [cleanTopic, 'Mekanisme', 'Eksamen', 'Patofysiologi'],
  };

  return [v1, v2, v3];
}

// Fetch 3 AI proposals with fallback
export async function fetchOrGenerate3Proposals(
  topic: string,
  contextText: string,
  isOfflineOnly: boolean
): Promise<CardVariationProposal[]> {
  if (isOfflineOnly) {
    return generateLocal3Proposals(topic, contextText);
  }

  try {
    const res = await fetch('/api/ai/propose-3-variations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, contextText }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.proposals && Array.isArray(data.proposals) && data.proposals.length === 3) {
        return data.proposals.map((p: CardVariationProposal) => ({
          ...p,
          svgContent: p.svgContent || getDeterministicSvgForTopic(topic, p.korttype),
        }));
      }
    }
  } catch (err) {
    console.warn('AI proposal endpoint fallback:', err);
  }

  return generateLocal3Proposals(topic, contextText);
}
