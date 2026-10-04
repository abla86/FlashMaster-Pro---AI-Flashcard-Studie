import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Public sales page
app.get('/sales', (_req: Request, res: Response) => {
  const paymentUrl = process.env.PAYMENT_URL || 'https://buy.stripe.com/5kQ14maom48ffWUfKL8og01';
  res.type('html').send(`<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FlashMaster Pro — 2104 flashcards</title><style>body{margin:0;background:#070b14;color:#f8fafc;font:16px system-ui,sans-serif}.wrap{max-width:900px;margin:auto;padding:70px 24px}.hero{padding:40px;border:1px solid #263247;border-radius:28px;background:linear-gradient(135deg,#111827,#0b1220)}h1{font-size:48px;line-height:1.05;margin:12px 0}p{color:#aab5c7;line-height:1.7}.price{font-size:38px;font-weight:900;margin:28px 0}.buy{display:inline-block;padding:16px 26px;border-radius:14px;background:#6366f1;color:white;text-decoration:none;font-weight:900}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:25px}.card{padding:20px;border:1px solid #263247;border-radius:18px;background:#0d1422}.small{font-size:13px;color:#718096;margin-top:28px}</style></head><body><main class="wrap"><section class="hero"><div>FLASHMASTER PRO</div><h1>2104 flashcards + ditt eget flashcard-studio.</h1><p>Studer smartere med ferdig masterbank, spaced repetition, egne kortsett og import fra PDF, Word, Excel, CSV og tekst. Eksporter til Anki og Quizlet.</p><div class="price">799 kr</div><a class="buy" href="${paymentUrl}">Kjøp FlashMaster Pro</a><div class="grid"><div class="card"><b>2104 kort</b><p>Ferdig masterbank inkludert.</p></div><div class="card"><b>Lag selv</b><p>Opprett egne kort og kortsett.</p></div><div class="card"><b>Importer</b><p>PDF, Word, Excel, CSV og tekst.</p></div><div class="card"><b>Studer</b><p>Spaced repetition og statistikk.</p></div></div><p class="small">Digitalt produkt. Ikke medisinsk rådgivning. Kjøp gir tilgang til FlashMaster Pro-produktet som beskrevet på salgssiden.</p></section></main></body></html>`);
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});

// AI Document & Text to Flashcards Endpoint
app.post('/api/ai/parse-document', async (req: Request, res: Response) => {
  try {
    const { textContent, fileName = 'Dokument', language = 'no', maxCards = 15 } = req.body;

    if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
      return res.status(400).json({ error: 'Tekstinnhold mangler' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API-nøkkel er ikke konfigurert på serveren. Bruk lokal offline-modus.',
      });
    }

    // Call Gemini 3.8 Flash to extract flashcards
    const prompt = `Du er en ekspert på pedagogisk læring og spaced repetition.
Gjennomgå følgende innhold fra filen "${fileName}" og lag inntil ${maxCards} høykvalitets flashcards.
Hvert kort SKAL ha:
1. "question": Tydelig, fokusert spørsmål eller konsept som skal testes.
2. "answer": Presist, pedagogisk og lettfattelig svar.
3. "reference": Kildehenvisning, paragraf, kapittel, sidetall, formelopphav eller faglig referanse (f.eks: "Pensum kap. 4", "Store Norske Leksikon", "Grunnloven § 1", "Tabell 2.1"). Hvis uspesifisert i teksten, gi en relevant kildekontekst.
4. "frontExtra": Eventuelt hint eller kontekst for forsiden.
5. "backExtra": Tilleggsinformasjon, utdyping eller stikkord for baksiden.
6. "tags": 1-3 relevante emneknagger (f.eks: ["Biologi", "Celler"]).
7. "suggestedDesign": Anbefalt kortdesign basert på tema. Velg nøyaktig én av: 'nordic' (naturvitenskap/generelt), 'minimalist' (språk/definisjoner), 'academic' (historie/samfunn/jus), 'cyber' (IT/kode/teknologi), 'studio' (kreativt/kunst/musikk), 'blueprint' (matematikk/fysikk/ingeniørfag).
8. "illustrationPrompt": Kort prompt for en pedagogisk illustrasjon (på engelsk eller norsk).
9. "svgIllustration": Valgfri ren, minimalistisk SVG-kode (kun <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">...</svg>) med enkel geometrisk vektorillustrasjon tilpasset emnet, med farger i cyan, indigo, amber eller emerald.

Innhold som skal analyseres:
---
${textContent.slice(0, 45000)}
---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Du er FlashMaster AI, en spesialisert pedagogisk assistent som konverterer råtekst, dokumenter og tabeller til profesjonelle flashcards med spørsmål, svar og referanse.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: {
              type: Type.STRING,
              description: 'En god tittel for dette kortsettet basert på innholdet',
            },
            deckDescription: {
              type: Type.STRING,
              description: 'Kort oppsummering av fagområdet eller temaet',
            },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  reference: { type: Type.STRING },
                  frontExtra: { type: Type.STRING },
                  backExtra: { type: Type.STRING },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  suggestedDesign: {
                    type: Type.STRING,
                    description: 'One of: nordic, minimalist, academic, cyber, studio, blueprint',
                  },
                  illustrationPrompt: { type: Type.STRING },
                  svgIllustration: { type: Type.STRING },
                },
                required: ['question', 'answer', 'reference', 'suggestedDesign'],
              },
            },
          },
          required: ['deckTitle', 'cards'],
        },
      },
    });

    const outputText = response.text || '{}';
    const parsedData = JSON.parse(outputText);

    return res.json({
      success: true,
      deckTitle: parsedData.deckTitle || 'Nytt kortsett',
      deckDescription: parsedData.deckDescription || '',
      cards: parsedData.cards || [],
    });
  } catch (error: any) {
    console.error('Error in parse-document endpoint:', error);
    return res.status(500).json({
      error: error?.message || 'Feil ved behandling av dokument med AI',
    });
  }
});

// Generate Illustration / SVG Schematic for a card
app.post('/api/ai/generate-illustration', async (req: Request, res: Response) => {
  try {
    const { question, answer, topic = 'Generelt' } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API er ikke tilgjengelig. Bruk standardikon.',
      });
    }

    const prompt = `Lag en ren, profesjonell, pedagogisk SVG-vektorillustrasjon (størrelse 120x120, viewBox="0 0 120 120") for et flashcard.
Tema: ${topic}
Spørsmål: ${question}
Svar: ${answer}

Krav:
- Returner KUN en gyldig SVG-streng (start med <svg and slutt med </svg>).
- Ingen markdown backticks, ingen HTML wrapper.
- Bruk mørk modus-vennlige farger (f.eks. aksenter i #6366f1, #38bdf8, #34d399, #f59e0b, #ec4899 på gjennomsiktig eller mørk bakgrunn #1e293b).
- Enkelt, elegant og pedagogisk diagram eller ikon.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let rawSvg = response.text || '';
    // Clean potential markdown blocks
    rawSvg = rawSvg.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();

    const svgMatch = rawSvg.match(/<svg[\s\S]*<\/svg>/i);
    const svgCode = svgMatch ? svgMatch[0] : '';

    return res.json({
      success: true,
      svg: svgCode,
    });
  } catch (error: any) {
    console.error('Error generating illustration:', error);
    return res.status(500).json({
      error: error?.message || 'Feil ved generering av illustrasjon',
    });
  }
});

// Generate 3 Distinct Card Variations for a topic or document excerpt (FlashForge 3-Proposal Engine)
app.post('/api/ai/propose-3-variations', async (req: Request, res: Response) => {
  try {
    const { topic, contextText = '' } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Emne eller tema mangler' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API er ikke konfigurert på serveren.',
      });
    }

    const prompt = `FlashForge Card Engine: Lag nøyaktig 3 DISTINKTE og ULIKE flashcards for temaet: "${topic}".
Kontekst fra kildedokument:
"${contextText.slice(0, 3000)}"

KRAV TIL DE 3 FORSLAGENE:
1. Forslag 1: Definisjon & Kjernerecall (Korttype: "Definisjon", Design: "Definition", Nivå: "Grunnleggende")
   - Tydelig definisjon og essensielt begrep.
2. Forslag 2: Klinisk Observasjon & Praktisk Case (Korttype: "Case", Design: "Clinical", Nivå: "Middels")
   - Konkret pasientcase/scenario, feilkilder, beslutningstre.
3. Forslag 3: Dyp Sammenheng & Eksamensanalyse (Korttype: "Dyp gjenhenting", Design: "Process", Nivå: "Avansert")
   - Årsak-virkningskjede, mekanismer, differensialdiagnoser.

Hvert kort SKAL ha:
- variantType: 'definisjon' | 'case' | 'dyp_forstaelse'
- title: Tittel på forslaget
- korttype: Korttype
- niva: Nivå
- forside: Spørsmål/oppgave (uten å avsløre svaret)
- bakside: Kort svar først, deretter forklaring/begrunnelse
- referansehenvisning: Direkte kildereferanse (f.eks: "NEL 2024, kap 2", "Lovdata § 1")
- fullReferanse: Full bibliografisk kilde
- design: Ett av FlashForge-designene
- begrunnelse: Hvorfor denne vinklingen er pedagogisk verdifull
- tagger: 2-4 relevante emneknagger`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Du er FlashForge Card Engine. Du lager presise, ulike og kildeintegre flashcard-varianter med minimalt tokenforbruk.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proposals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  variantType: { type: Type.STRING },
                  title: { type: Type.STRING },
                  korttype: { type: Type.STRING },
                  niva: { type: Type.STRING },
                  forside: { type: Type.STRING },
                  bakside: { type: Type.STRING },
                  referansehenvisning: { type: Type.STRING },
                  fullReferanse: { type: Type.STRING },
                  design: { type: Type.STRING },
                  begrunnelse: { type: Type.STRING },
                  tagger: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'variantType',
                  'title',
                  'korttype',
                  'niva',
                  'forside',
                  'bakside',
                  'referansehenvisning',
                  'fullReferanse',
                  'design',
                  'begrunnelse',
                  'tagger',
                ],
              },
            },
          },
          required: ['proposals'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      proposals: parsed.proposals || [],
    });
  } catch (error: any) {
    console.error('Error generating 3 variations:', error);
    return res.status(500).json({
      error: error?.message || 'Feil ved generering av forslag',
    });
  }
});

// Start Express and integrate Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`FlashMaster Pro dev server running at http://0.0.0.0:${port}`);
  });
}

startServer();
