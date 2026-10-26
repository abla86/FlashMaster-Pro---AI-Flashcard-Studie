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
const VIPPS_API_BASE = process.env.VIPPS_API_BASE || 'https://api.vipps.no';
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY;
const VIPPS_MSN = process.env.VIPPS_MSN;
const VIPPS_WEBHOOK_SECRET = process.env.VIPPS_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || 'https://flashmaster-pro-sxg7.onrender.com';
const PRO_PRICE_NOK = 79900;
const ENTITLEMENT_SECRET = process.env.ENTITLEMENT_SECRET || process.env.AUTH_SESSION_SECRET;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SELLER_LEGAL_NAME = process.env.SELLER_LEGAL_NAME || '';
const SELLER_POSTAL_ADDRESS = process.env.SELLER_POSTAL_ADDRESS || '';
const SELLER_ORG_NUMBER = process.env.SELLER_ORG_NUMBER || '';
const SELLER_CONTACT_EMAIL = process.env.SELLER_CONTACT_EMAIL || '';

function hasSalesLegalInfo() {
  return Boolean(SELLER_LEGAL_NAME.trim() && SELLER_POSTAL_ADDRESS.trim() && SELLER_ORG_NUMBER.trim() && SELLER_CONTACT_EMAIL.trim());
}
function hasStripeConfig() {
  return Boolean(hasSalesLegalInfo() && STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET && ENTITLEMENT_SECRET);
}
function hasVippsConfig() {
  return Boolean(hasSalesLegalInfo() && VIPPS_CLIENT_ID && VIPPS_CLIENT_SECRET && VIPPS_SUBSCRIPTION_KEY && VIPPS_MSN && VIPPS_WEBHOOK_SECRET && ENTITLEMENT_SECRET);
}
function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[char]!));
}
function signValue(value: string) {
  const crypto = require('node:crypto');
  return crypto.createHmac('sha256', ENTITLEMENT_SECRET!).update(value).digest('base64url');
}
function signedEntitlement(provider: string, reference: string, ttlMs = 365 * 24 * 60 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${provider}:${reference}:${expiresAt}`;
  return payload + '.' + signValue(payload);
}
function verifyEntitlement(value?: string) {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = signValue(payload);
  const crypto = require('node:crypto');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const parts = payload.split(':');
  if (parts.length !== 3 || !['vipps', 'stripe'].includes(parts[0]) || !parts[1]) return null;
  const expiresAt = Number(parts[2]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return null;
  return payload;
}
async function vippsAccessToken() {
  if (!hasVippsConfig()) throw new Error('Vipps production credentials are not configured');
  const response = await fetch(`${VIPPS_API_BASE}/accesstoken/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      client_id: VIPPS_CLIENT_ID!,
      client_secret: VIPPS_CLIENT_SECRET!,
      'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY!,
      'Merchant-Serial-Number': VIPPS_MSN!,
    },
    body: '',
  });
  if (!response.ok) throw new Error(`Vipps access token failed: ${response.status}`);
  const data = await response.json() as { access_token: string };
  return data.access_token;
}
async function vippsRequest(pathname: string, init: RequestInit = {}) {
  const token = await vippsAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Ocp-Apim-Subscription-Key', VIPPS_SUBSCRIPTION_KEY!);
  headers.set('Merchant-Serial-Number', VIPPS_MSN!);
  headers.set('Vipps-System-Name', 'flashmaster');
  headers.set('Vipps-System-Version', '1.0.0');
  headers.set('Content-Type', 'application/json');
  return fetch(`${VIPPS_API_BASE}${pathname}`, { ...init, headers });
}


app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  try {
    if (!STRIPE_WEBHOOK_SECRET) return res.status(503).send('Stripe webhook secret is not configured');
    const signature = String(req.headers['stripe-signature'] || '');
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    const timestamp = signature.split(',').find((part: string) => part.startsWith('t='))?.slice(2);
    const signatures = signature.split(',').filter((part: string) => part.startsWith('v1=')).map((part: string) => part.slice(3));
    const timestampSeconds = Number(timestamp);
    if (!timestamp || !Number.isSafeInteger(timestampSeconds) || signatures.length === 0) {
      return res.status(400).send('Invalid Stripe signature');
    }
    // Reject stale webhook signatures to reduce replay risk.
    if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > 300) {
      return res.status(400).send('Expired Stripe signature');
    }
    const signedPayload = timestamp + '.' + rawBody.toString('utf8');
    const expected = require('node:crypto').createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload).digest('hex');
    const valid = signatures.some((candidate: string) => candidate.length === expected.length && require('node:crypto').timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)));
    if (!valid) return res.status(400).send('Invalid Stripe signature');
    JSON.parse(rawBody.toString('utf8'));
    // Payment status is verified against Stripe's API when the buyer returns.
    return res.sendStatus(204);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.sendStatus(400);
  }
});

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

// Create a server-side Stripe Checkout Session with fixed product metadata and price.
app.get('/api/stripe/create-payment', async (_req: Request, res: Response) => {
  try {
    if (!hasStripeConfig()) {
      return res.status(503).json({ error: 'Stripe payment is not configured on the server.' });
    }
    const params = new URLSearchParams({
      mode: 'payment',
      success_url: `${APP_URL}/purchase-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/sales?payment=cancelled`,
      'line_items[0][price_data][currency]': 'nok',
      'line_items[0][price_data][unit_amount]': String(PRO_PRICE_NOK),
      'line_items[0][price_data][product_data][name]': 'FlashMaster Pro',
      'line_items[0][price_data][product_data][description]': 'Flashcard studio and included masterbank',
      'line_items[0][quantity]': '1',
      'metadata[product_code]': 'flashmaster-pro',
      'payment_intent_data[metadata][product_code]': 'flashmaster-pro',
    });
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const session = await response.json() as { id?: string; url?: string; error?: { message?: string } };
    if (!response.ok || !session.url || !session.id) {
      console.error('Stripe Checkout session creation failed:', response.status);
      return res.status(502).json({ error: 'Could not start card payment.' });
    }
    return res.redirect(303, session.url);
  } catch (error) {
    console.error('Stripe Checkout creation error:', error);
    return res.status(502).json({ error: 'Could not start card payment.' });
  }
});

// Legal and data-handling information. Payment stays disabled until seller identity is configured.
app.get('/terms', (_req: Request, res: Response) => {
  const seller = escapeHtml(SELLER_LEGAL_NAME || 'Selgeropplysninger ikke konfigurert');
  const address = escapeHtml(SELLER_POSTAL_ADDRESS || 'Ikke konfigurert');
  const orgNumber = escapeHtml(SELLER_ORG_NUMBER || 'Ikke konfigurert');
  const email = escapeHtml(SELLER_CONTACT_EMAIL || 'Ikke konfigurert');
  res.type('html').send(`<!doctype html><html lang="no"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vilkår — FlashMaster Pro</title><body style="max-width:800px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui;color:#172033"><h1>Vilkår for FlashMaster Pro</h1><p><b>Selger:</b> ${seller}<br><b>Adresse:</b> ${address}<br><b>Organisasjonsnummer:</b> ${orgNumber}<br><b>Kontakt:</b> ${email}</p><h2>Produkt og pris</h2><p>FlashMaster Pro er et digitalt studieprodukt. Oppgitt pris er 799 NOK for engangskjøp. Eventuelle avgifter og betalingsvilkår skal fremgå før bestilling. Det er ikke et abonnement med mindre dette uttrykkelig opplyses før kjøpet.</p><h2>Tilgang og funksjoner</h2><p>Funksjoner kan være avhengige av nettleser, hosting, betalingsleverandør og eksterne AI-tjenester. AI-generert innhold kan være feil eller ufullstendig og må kontrolleres av brukeren.</p><h2>Angrerett og reklamasjon</h2><p>Lovbestemte forbrukerrettigheter gjelder. Denne siden hevder ikke at angreretten bortfaller ved umiddelbar levering av digitalt innhold. Kontakt selgeren på adressen over for spørsmål, feil, refusjon eller bruk av angrerett. Vilkår og bestillingsflyt må være gjennomgått før salg aktiveres.</p><h2>Ansvarsgrense</h2><p>Flashcards er læringsstøtte, ikke medisinsk rådgivning eller erstatning for oppdaterte fagkilder, formell opplæring eller klinisk skjønn.</p><p><a href="/sales">Tilbake til produktet</a> · <a href="/privacy">Personvern</a> · <a href="/withdrawal">Angrerett</a></p></body></html>`);
});

app.get('/privacy', (_req: Request, res: Response) => {
  const seller = escapeHtml(SELLER_LEGAL_NAME || 'Selgeropplysninger ikke konfigurert');
  const email = escapeHtml(SELLER_CONTACT_EMAIL || 'Ikke konfigurert');
  res.type('html').send(`<!doctype html><html lang="no"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Personvern — FlashMaster Pro</title><body style="max-width:800px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui;color:#172033"><h1>Personvern</h1><p><b>Behandlingsansvarlig / kontakt:</b> ${seller}, ${email}</p><h2>Studiedata</h2><p>Kort, kortsett og statistikk lagres i nettleserens LocalStorage og IndexedDB. Appen sletter data logisk når brukeren velger sletting, men garanterer ikke sikker overskriving av lagringsmediet. Data i nettleseren er ikke kryptert av appen og kan være tilgjengelig for skript med samme opprinnelse eller andre som har tilgang til nettleserprofilen.</p><h2>AI-funksjoner</h2><p>Når AI-funksjoner brukes, kan teksten eller dokumentinnholdet som er nødvendig for funksjonen sendes fra serveren til Google Gemini. Ikke send helseopplysninger, pasientidentifiserbare data, arbeidsgiverkonfidensielt materiale eller annet sensitivt innhold uten at bruken og behandlingsgrunnlaget er vurdert på forhånd.</p><h2>Betaling og tekniske data</h2><p>Ved kjøp behandles betalingsopplysninger av valgt betalingsleverandør (Stripe og/eller Vipps). Appen mottar betalingsstatus og tekniske forespørsler. Hosting- og nettverksleverandører kan behandle tekniske logger. Kontroller gjeldende vilkår hos leverandørene.</p><h2>Dine valg og kontakt</h2><p>Du kan slette lokale studiedata via appens slettefunksjon og nettleserens lagringsinnstillinger. Dette fjerner ikke nødvendigvis logger eller opplysninger som betalingsleverandører er pålagt å beholde. For innsyn, retting, sletting eller spørsmål, kontakt ${email}. Selger må bekrefte behandlingsgrunnlag, lagringstid, databehandlere og rettighetsprosedyre før salg åpnes.</p><p><a href="/sales">Tilbake til produktet</a> · <a href="/terms">Vilkår</a> · <a href="/withdrawal">Angrerett</a></p></body></html>`);
});

app.get('/withdrawal', (_req: Request, res: Response) => {
  const email = escapeHtml(SELLER_CONTACT_EMAIL || 'Ikke konfigurert');
  res.type('html').send(`<!doctype html><html lang="no"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Angrerett — FlashMaster Pro</title><body style="max-width:800px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui;color:#172033"><h1>Angrerett og henvendelser</h1><p>Lovbestemte rettigheter etter gjeldende forbrukerregler gjelder. Denne siden lover ikke at angreretten bortfaller når digital tilgang gis. For å melde at du vil angre kjøpet, send en tydelig melding til <a href="mailto:${email}">${email}</a> med kjøpsdato, betalingsreferanse og at du ønsker å benytte angreretten. Ikke send kortnummer eller andre betalingshemmeligheter.</p><p><b>Standardmelding:</b> «Jeg gir med dette melding om at jeg ønsker å gå fra avtalen om kjøp av FlashMaster Pro. Kjøpsdato: ____. Betalingsreferanse: ____.»</p><p>Selger må sikre at lovpålagt forhåndsinformasjon, standard angreskjema og ordrebekreftelse gis på riktig måte før salg aktiveres.</p><p><a href="/sales">Tilbake til produktet</a> · <a href="/terms">Vilkår</a> · <a href="/privacy">Personvern</a></p></body></html>`);
});

// Public sales page
app.get('/sales', (_req: Request, res: Response) => {
  const stripeButton = hasStripeConfig() ? '<a class="buy" href="/api/stripe/create-payment">Kjøp med kort</a>' : '';
  const vippsButton = hasVippsConfig() ? '<a class="buy secondary" href="/api/vipps/create-payment">Kjøp med Vipps</a>' : '';
  const paymentUnavailable = !hasSalesLegalInfo()
    ? '<p class="small">Kjøp er deaktivert til selgeridentitet, organisasjonsnummer, postadresse og kontaktadresse er konfigurert. Dette er nødvendig før produktet kan selges.</p>'
    : (!hasStripeConfig() && !hasVippsConfig()
      ? '<p class="small">Betaling er ikke tilgjengelig akkurat nå. Ingen betaling kan gjennomføres før betalingsoppsettet er aktivert.</p>'
      : '');
  res.type('html').send(`<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FlashMaster Pro — 2104 flashcards</title><style>body{margin:0;background:#070b14;color:#f8fafc;font:16px system-ui,sans-serif}.wrap{max-width:900px;margin:auto;padding:70px 24px}.hero{padding:40px;border:1px solid #263247;border-radius:28px;background:linear-gradient(135deg,#111827,#0b1220)}h1{font-size:48px;line-height:1.05;margin:12px 0}p{color:#aab5c7;line-height:1.7}.price{font-size:38px;font-weight:900;margin:28px 0}.buy{display:inline-block;padding:16px 26px;border-radius:14px;background:#6366f1;color:white;text-decoration:none;font-weight:900;margin:4px}.buy.secondary{background:#334155}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:25px}.card{padding:20px;border:1px solid #263247;border-radius:18px;background:#0d1422}.small{font-size:13px;color:#718096;margin-top:28px}</style></head><body><main class="wrap"><section class="hero"><div>FLASHMASTER PRO</div><h1>2104 flashcards + ditt eget flashcard-studio.</h1><p>Studer smartere med ferdig masterbank, spaced repetition, egne kortsett og import fra PDF, Word, Excel, CSV og tekst. Eksporter til Anki og Quizlet.</p><div class="price">799 kr</div>${stripeButton}${vippsButton}${paymentUnavailable}<div class="grid"><div class="card"><b>2104 kort</b><p>Ferdig masterbank inkludert.</p></div><div class="card"><b>Lag selv</b><p>Opprett egne kort og kortsett.</p></div><div class="card"><b>Importer</b><p>PDF, Word, Excel, CSV og tekst.</p></div><div class="card"><b>Studer</b><p>Spaced repetition og statistikk.</p></div></div><p class="small">Digitalt produkt. Ikke medisinsk rådgivning. AI-generert læringsinnhold må kontrolleres. <a href="/terms">Vilkår</a> · <a href="/privacy">Personvern</a> · <a href="/withdrawal">Angrerett</a></p></section></main></body></html>`);
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});


app.get('/api/stripe/status', async (req: Request, res: Response) => {
  const sessionId = String(req.query.session_id || '');
  if (!hasStripeConfig() || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(403).json({ pro: false });
  }

  try {
    // Verify payment directly with Stripe so a process restart cannot erase purchase evidence.
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    if (!response.ok) return res.status(403).json({ pro: false });
    const session = await response.json() as {
      id?: string;
      mode?: string;
      payment_status?: string;
      currency?: string;
      amount_total?: number;
      metadata?: Record<string, string>;
    };
    const paid = session.id === sessionId &&
      session.mode === 'payment' &&
      session.payment_status === 'paid' &&
      session.currency === 'nok' &&
      Number(session.amount_total) === PRO_PRICE_NOK &&
      session.metadata?.product_code === 'flashmaster-pro';
    if (!paid) return res.status(403).json({ pro: false });

    res.cookie('flashmaster_pro', signedEntitlement('stripe', sessionId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.json({ pro: true });
  } catch (error) {
    console.error('Stripe payment verification failed:', error);
    return res.status(502).json({ pro: false, error: 'Could not verify payment status.' });
  }
});

// Vipps checkout and entitlement
app.get('/api/vipps/create-payment', async (_req: Request, res: Response) => {
  try {
    if (!hasVippsConfig()) return res.status(503).json({ error: 'Vipps production credentials are not configured on the server yet.' });
    const crypto = require('node:crypto');
    const reference = `flashmaster-${crypto.randomBytes(12).toString('hex')}`;
    const returnUrl = `${APP_URL}/purchase-complete?reference=${encodeURIComponent(reference)}`;
    const response = await vippsRequest('/epayment/v1/payments', {
      method: 'POST',
      headers: { 'Idempotency-Key': reference },
      body: JSON.stringify({
        amount: { currency: 'NOK', value: PRO_PRICE_NOK },
        paymentMethod: { type: 'WALLET' },
        reference,
        paymentDescription: 'FlashMaster Pro — 2104 flashcards + eget flashcard-studio',
        returnUrl,
        userFlow: 'WEB_REDIRECT',
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });
    res.cookie('flashmaster_pending', signedEntitlement('vipps', reference, 15 * 60 * 1000), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000, path: '/' });
    return res.redirect(data.redirectUrl);
  } catch (error: any) {
    console.error('Vipps create payment error:', error);
    return res.status(500).json({ error: error?.message || 'Kunne ikke starte Vipps-betaling' });
  }
});

app.get('/api/vipps/status', async (req: Request, res: Response) => {
  try {
    if (!hasVippsConfig()) return res.status(503).json({ pro: false, configured: false });
    const reference = String(req.query.reference || '');
    const pending = verifyEntitlement(req.headers.cookie?.match(/(?:^|; )flashmaster_pending=([^;]+)/)?.[1]);
    if (!reference || !pending?.startsWith(`vipps:${reference}:`)) return res.status(403).json({ pro: false, error: 'Ugyldig betalingsreferanse' });
    const response = await vippsRequest(`/epayment/v1/payments/${encodeURIComponent(reference)}`);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ pro: false, error: data });
    const captured = Number(data?.aggregate?.capturedAmount?.value || 0) >= PRO_PRICE_NOK;
    if (captured) {
      res.cookie('flashmaster_pro', signedEntitlement('vipps', reference), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
      return res.json({ pro: true, state: data.state, reference });
    }
    if (data.state === 'AUTHORIZED' && Number(data?.aggregate?.authorizedAmount?.value || 0) >= PRO_PRICE_NOK) {
      const capture = await vippsRequest(`/epayment/v1/payments/${encodeURIComponent(reference)}/capture`, {
        method: 'POST',
        headers: { 'Idempotency-Key': `capture-${reference}` },
        body: JSON.stringify({ modificationAmount: { currency: 'NOK', value: PRO_PRICE_NOK } }),
      });
      if (capture.ok || capture.status === 409) {
        res.cookie('flashmaster_pro', signedEntitlement('vipps', reference), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
        return res.json({ pro: true, state: 'CAPTURED', reference });
      }
    }
    return res.json({ pro: false, state: data.state || 'PENDING', reference });
  } catch (error: any) {
    console.error('Vipps status error:', error);
    return res.status(500).json({ pro: false, error: error?.message || 'Kunne ikke kontrollere betaling' });
  }
});

app.get('/api/pro/status', (req: Request, res: Response) => {
  const reference = verifyEntitlement(req.headers.cookie?.match(/(?:^|; )flashmaster_pro=([^;]+)/)?.[1]);
  res.json({ pro: Boolean(reference), configured: hasVippsConfig() || hasStripeConfig(), vippsConfigured: hasVippsConfig(), stripeConfigured: hasStripeConfig() });
});

app.get('/purchase-complete', (req: Request, res: Response) => {
  res.redirect('/?purchase=complete&session_id=' + encodeURIComponent(String(req.query.session_id || '')) + '&reference=' + encodeURIComponent(String(req.query.reference || '')));
});

app.post('/api/vipps/webhook', async (req: Request, res: Response) => {
  try {
    // Never trust an internet-reachable webhook without a configured shared secret.
    if (!VIPPS_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Vipps webhook authentication is not configured.' });
    }
    const suppliedAuthorization = String(req.headers.authorization || '');
    const suppliedSecret = suppliedAuthorization.startsWith('Bearer ')
      ? suppliedAuthorization.slice(7)
      : '';
    const crypto = require('node:crypto');
    const expectedSecret = Buffer.from(VIPPS_WEBHOOK_SECRET, 'utf8');
    const actualSecret = Buffer.from(suppliedSecret, 'utf8');
    if (
      actualSecret.length !== expectedSecret.length ||
      !crypto.timingSafeEqual(actualSecret, expectedSecret)
    ) {
      return res.status(401).json({ error: 'Invalid webhook authorization.' });
    }

    const event = req.body || {};
    const reference = String(event.reference || '');
    const name = String(event.name || '');
    if (!reference.startsWith('flashmaster-')) return res.status(400).json({ error: 'Invalid reference' });
    if (name === 'AUTHORIZED') {
      const capture = await vippsRequest(`/epayment/v1/payments/${encodeURIComponent(reference)}/capture`, {
        method: 'POST',
        headers: { 'Idempotency-Key': `capture-${reference}` },
        body: JSON.stringify({ modificationAmount: { currency: 'NOK', value: PRO_PRICE_NOK } }),
      });
      if (!capture.ok && capture.status !== 409) console.error('Vipps webhook capture failed', reference, capture.status);
    }
    return res.sendStatus(204);
  } catch (error) {
    console.error('Vipps webhook error:', error);
    return res.sendStatus(500);
  }
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
