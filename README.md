# FlashMaster Pro

**Kjøp FlashMaster Pro: 799 kr**  
https://buy.stripe.com/5kQ14maom48ffWUfKL8og01

**Produkt:** https://flashmaster-pro-sxg7.onrender.com/sales

AI-assisted flashcard and study application for creating, importing, studying, reviewing and exporting structured learning material.

## Produktet som selges

- **2104-korts masterbank inkludert**
- Lag egne flashcards og egne kortsett
- Importer PDF, Word, Excel, CSV og tekst
- AI-generering av flashcards
- Spaced repetition, studieplan og statistikk
- AI-illustrasjoner og kortdesign
- Eksport til Anki og Quizlet
- Lokal/offline lagring av egne studie-data

Kjøpet er et digitalt produkt til **799 kr** via Stripe. Kjøpsflyten bruker samme FlashMaster-applikasjon som produktet er bygget på.

## What it demonstrates

- React + TypeScript + Vite
- Express/TypeScript backend
- Google Gemini API integration kept server-side
- Flashcard and deck management
- Spaced-repetition-oriented study workflows
- Import/export workflows
- Statistics and study planning
- IndexedDB/local browser persistence
- Offline/privacy-oriented controls
- SVG illustration generation
- AI-assisted document-to-flashcard conversion

## Architecture

```text
React / Vite
   |
   +-- Dashboard
   +-- Card library
   +-- Study sessions
   +-- Statistics
   +-- Import/export
   +-- Study planning
   |
   v
Express API
   |
   v
Google Gemini API (optional)
```

The application can retain local study data in the browser. AI features require a server-side Gemini API key.

## Local development

Requirements:

- Node.js 20+
- npm
- Gemini API key for AI features

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example` and configure the required environment values. Never commit real secrets.

Start development:

```bash
npm run dev
```

The application uses port 3000.

## Verification

```bash
npm run lint
npm run build
```

GitHub Actions performs these checks automatically on pushes and pull requests.

## Privacy and security

- AI credentials are server-side configuration and must never be committed.
- Use synthetic or non-sensitive learning material in public demonstrations.
- Do not submit confidential, patient-identifiable, employer-confidential or otherwise restricted material to an AI provider unless the deployment and data-processing basis has been explicitly approved.
- Generated educational content must be reviewed against authoritative sources before being relied upon for academic, clinical, legal or other high-stakes decisions.

## Publication boundary

FlashMaster Pro is an educational software demonstration. It does not guarantee factual correctness of AI-generated flashcards and does not replace authoritative textbooks, guidelines, legislation, clinical judgement or formal assessment.

## License

Apache License 2.0. See [LICENSE](LICENSE).


## Disclaimers and limitations

- **Project status:** Features may be incomplete, experimental, or unverified. Confirm behavior against the current code, tests, and configuration before relying on it.
- **No warranty:** Provided as-is, without guarantees of correctness, availability, security, or production readiness. Review and test changes before production use.
- **Security and data:** Never commit credentials, API keys, personal information, or confidential data. Review permissions, external services, logging, retention, and dependency risks. Automated checks are not a complete security audit.
- **Testing and deployment:** Passing tests or static checks does not prove all behavior is correct or deployment is safe. Verify functionality, access controls, dependencies, backups, monitoring, and operational requirements independently.
- **Domain-specific limitation:** AI-generated flashcards and explanations may contain errors. Check learning content against reliable course material and original sources; generated questions and progress metrics do not guarantee mastery or exam readiness. Review external AI data handling before submitting private study material.
