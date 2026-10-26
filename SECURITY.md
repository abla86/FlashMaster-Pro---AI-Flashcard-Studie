# Security, privacy and responsible use

## Scope
FlashMaster Pro stores study material in browser storage and can send selected content to server-side AI integrations when those features are used. Browser storage is not encrypted by this application, and deleting it through the UI is logical deletion, not guaranteed forensic erasure.

## Data handling
- Use synthetic or non-sensitive study material in public demonstrations.
- Do not upload patient-identifiable, employer-confidential or otherwise restricted content to an AI provider unless the provider, deployment, retention and lawful basis have been reviewed.
- Review imported and exported files before opening or sharing them. File parsing and sanitization are not a malware scanner or a guarantee against malicious documents or formulas.
- Local study data can be accessible to scripts running in the same origin and to anyone with access to the browser profile/device.
- Payment status must be verified server-side. Never trust a client-side success query parameter alone.

## Secrets
Keep `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VIPPS_CLIENT_SECRET`, `VIPPS_SUBSCRIPTION_KEY`, `VIPPS_WEBHOOK_SECRET` and `ENTITLEMENT_SECRET` in server-side secret storage. Never commit them. Rotate exposed secrets.

## Reporting
Do not publish credentials, payment identifiers tied to a person, or personal data in public issues. Use private vulnerability reporting if enabled; otherwise contact the maintainer privately with a redacted reproduction.

## Limitations
Flashcards and AI-generated educational content may be incomplete or incorrect. Clinical and medication-related content must be checked against authoritative, current sources and must not replace formal education, local procedures or clinical judgement.