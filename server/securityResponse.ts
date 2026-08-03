// ADR-0035 / ESS-0014 — Google Marketing Strict CSP response guard.
//
// Dieses Modul wird aus der bereits als erste Express-Middleware registrierten
// requestContext()-Schicht aufgerufen. Dadurch kann es die bestehende, spaeter in server.ts
// gesetzte CSP kontrolliert auf die ADR-0035-Policy normalisieren, ohne den sehr grossen
// Server-Einstiegspunkt mit weiterem Querschnittscode aufzublaehen.
//
// Kerninvarianten:
// - kryptographisch zufaelliger Nonce pro Response;
// - gleicher Nonce im CSP-Header und in den Script-Tags der HTML-Response;
// - HTML wird nicht gecacht, weil ein gecachter Body einen alten Nonce tragen wuerde;
// - CookieHub-Endpunkte gemaess Hersteller-CSP werden explizit beruecksichtigt;
// - AdSense nutzt Googles dokumentierte Strict-CSP-Vertrauenswurzel
//   (nonce + strict-dynamic) statt einer driftanfaelligen Ad-Domain-Allowlist.

import crypto from 'crypto';
import type { Request, Response } from 'express';

const CSP_NONCE_PLACEHOLDER = '__CSP_NONCE__';

function createRequestNonce(): string {
  // 18 Bytes = 144 Bit Entropie; oberhalb der in ESS-0014-CONTRACTS geforderten 128 Bit.
  return crypto.randomBytes(18).toString('base64url');
}

function buildProductionCsp(nonce: string): string {
  return [
    "default-src 'self' https:",
    "object-src 'none'",
    "base-uri 'none'",
    // Google AdSense dokumentiert fuer Strict CSP genau diese Vertrauensstruktur. In
    // CSP3-Browsern ist 'unsafe-inline' bei vorhandenem nonce/strict-dynamic nicht die
    // Vertrauenswurzel. 'unsafe-eval' bleibt ein bewusst dokumentierter Provider-
    // Kompatibilitaets-Trade-off und wird in ADR-0035 nachverfolgt.
    `script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`,
    // CookieHub: cookiehub.net + cdn.cookiehub.eu sind laut Hersteller fuer Styles noetig.
    "style-src 'self' https://fonts.googleapis.com https://cookiehub.net https://cdn.cookiehub.eu",
    "font-src 'self' data: https://fonts.gstatic.com",
    // Bildressourcen von Google Ads/AdSense koennen providerseitig wechseln. Die kritische
    // Script-Ausfuehrung bleibt trotzdem ueber Nonce/strict-dynamic hart kontrolliert.
    "img-src 'self' data: blob: https:",
    // CookieHub dokumentiert diese Hosts explizit. `https:` bleibt als kontrollierter
    // Netzwerk-Fallback fuer Google-Marketing-Ressourcen bestehen, deren Hostmenge sich
    // laut AdSense-Dokumentation aendern kann. Diese Breite betrifft keine Script-Ausfuehrung.
    "connect-src 'self' https://ds.cookiehub.net https://consent.cookiehub.net https://region-eu.cookiehub.net https://consent-eu.cookiehub.net https://cookiehub.net https://cdn.cookiehub.eu https:",
    // AdSense/Google/Stripe erzeugen legitime Drittanbieter-Frames. frame-ancestors bleibt
    // separat auf self begrenzt und verhindert weiterhin fremdes Einbetten von CAPITAL-AI.
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "form-action 'self' https:",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ') + ';';
}

function buildDevelopmentCsp(): string {
  // Entwicklungsmodus: Vite HMR benoetigt eval/inline/ws. Produktionssicherheit wird hier
  // bewusst nicht simuliert; die Production-Policy oben ist die normative Policy.
  return [
    "default-src 'self' https: data: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' data: https:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: ws: wss:",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "frame-ancestors 'self' https://ai.studio http://localhost:*",
  ].join('; ') + ';';
}

function toBuffer(chunk: unknown, encoding?: BufferEncoding): Buffer {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);
  return Buffer.from(String(chunk ?? ''), encoding);
}

function isLikelyHtmlNavigation(req: Request): boolean {
  if (req.method !== 'GET') return false;
  const accept = String(req.headers.accept || '').toLowerCase();
  if (accept.includes('text/html')) return true;
  if (req.path === '/' || req.path.endsWith('.html')) return true;
  // SPA-Routen sind typischerweise extensionless. API-Routen werden explizit ausgeschlossen.
  return !req.path.startsWith('/api/') && !/\/[^/]+\.[a-z0-9]+$/i.test(req.path);
}

/**
 * Haengt den Security-Response-Context an genau einen Express Request.
 *
 * Die bestehende CSP in server.ts wird nicht parallel wirksam: setHeader wird fuer exakt den
 * Headernamen Content-Security-Policy normalisiert, so dass spaetere Legacy-Setzungen die
 * ADR-0035-Policy nicht zurueckbauen koennen. Alle anderen Header passieren unveraendert.
 */
export function attachSecurityResponseContext(req: Request, res: Response): void {
  const nonce = createRequestNonce();
  res.locals.cspNonce = nonce;

  const production = process.env.NODE_ENV === 'production';
  const authoritativeCsp = production ? buildProductionCsp(nonce) : buildDevelopmentCsp();

  const originalSetHeader = res.setHeader.bind(res);
  const originalRemoveHeader = res.removeHeader.bind(res);
  const originalWrite = res.write.bind(res) as any;
  const originalEnd = res.end.bind(res) as any;

  // Verhindert, dass die spaeter registrierte Legacy-CSP in server.ts die pro-Response
  // Strict-CSP wieder ueberschreibt. Das ist eine gezielte Header-Normalisierung, kein
  // generelles Monkeypatching anderer Response-Header.
  (res as any).setHeader = (name: string, value: string | number | readonly string[]) => {
    if (String(name).toLowerCase() === 'content-security-policy') {
      return originalSetHeader(name, authoritativeCsp);
    }
    return originalSetHeader(name, value);
  };

  originalSetHeader('Content-Security-Policy', authoritativeCsp);
  originalSetHeader('X-CSP-Policy', 'ADR-0035');

  // Ein dynamischer CSP-Nonce und ein 304/cached HTML-Body duerfen niemals gemischt werden:
  // der Browser wuerde sonst einen alten Body-Nonce gegen einen neuen Header-Nonce pruefen.
  // Fuer HTML-Navigationen werden deshalb Conditional-/Range-Requests entfernt und spaeter
  // Cache-Control:no-store gesetzt. API- und Asset-Responses bleiben unberuehrt.
  if (isLikelyHtmlNavigation(req)) {
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
    delete req.headers.range;
  }

  let responseTypeDecided = false;
  let bufferHtml = false;
  const chunks: Buffer[] = [];

  const decideResponseType = () => {
    if (responseTypeDecided) return;
    responseTypeDecided = true;
    const contentType = String(res.getHeader('content-type') || '').toLowerCase();
    bufferHtml = contentType.includes('text/html');
  };

  (res as any).write = (chunk: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void) => {
    decideResponseType();
    if (!bufferHtml) {
      return originalWrite(chunk as any, encoding as any, callback as any);
    }

    const actualEncoding = typeof encoding === 'string' ? encoding : undefined;
    chunks.push(toBuffer(chunk, actualEncoding));
    const cb = typeof encoding === 'function' ? encoding : callback;
    if (cb) queueMicrotask(cb);
    return true;
  };

  (res as any).end = (chunk?: unknown, encoding?: BufferEncoding | (() => void), callback?: () => void) => {
    decideResponseType();
    if (!bufferHtml) {
      return originalEnd(chunk as any, encoding as any, callback as any);
    }

    const actualEncoding = typeof encoding === 'string' ? encoding : undefined;
    if (chunk !== undefined && chunk !== null) {
      chunks.push(toBuffer(chunk, actualEncoding));
    }

    const rawHtml = Buffer.concat(chunks).toString('utf8');
    const html = rawHtml.split(CSP_NONCE_PLACEHOLDER).join(nonce);

    originalRemoveHeader('etag');
    originalRemoveHeader('last-modified');
    originalRemoveHeader('content-length');
    originalSetHeader('Cache-Control', 'no-store, max-age=0');
    originalSetHeader('Content-Length', String(Buffer.byteLength(html, 'utf8')));
    originalSetHeader('Content-Security-Policy', authoritativeCsp);

    const cb = typeof encoding === 'function' ? encoding : callback;
    return originalEnd(html, 'utf8', cb);
  };
}
