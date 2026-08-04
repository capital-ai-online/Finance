// ADR-0035 / ESS-0014 / ADR-0040 — Google Marketing CSP response guard.
//
// ADR-0035 introduced a per-response nonce and strict-dynamic policy. ADR-0040 adds a
// production-safe rollout boundary after the strict policy could prevent the Vite/React
// bootstrap from rendering. Production therefore supports three explicit modes:
//
// - baseline: availability-safe enforced CSP with first-party scripts explicitly allowed;
// - report-only: baseline enforced + strict nonce policy in report-only mode (default);
// - strict: strict nonce + strict-dynamic policy enforced after production evidence exists.
//
// The same cryptographic nonce is injected into the HTML and every generated CSP variant.
// HTML remains no-store so a cached body can never be paired with a new response nonce.

import crypto from 'crypto';
import type { Request, Response } from 'express';

const CSP_NONCE_PLACEHOLDER = '__CSP_NONCE__';
const DEFAULT_PRODUCTION_CSP_MODE: ProductionCspMode = 'report-only';

export type ProductionCspMode = 'baseline' | 'report-only' | 'strict';

export function resolveProductionCspMode(value = process.env.CSP_MODE): ProductionCspMode {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'baseline' || normalized === 'report-only' || normalized === 'strict') {
    return normalized;
  }
  return DEFAULT_PRODUCTION_CSP_MODE;
}

function createRequestNonce(): string {
  // 18 Bytes = 144 Bit Entropie; oberhalb der in ESS-0014-CONTRACTS geforderten 128 Bit.
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * Enforced recovery/baseline policy.
 *
 * The Vite application bundle is explicitly trusted through 'self'. A nonce mismatch can
 * therefore no longer blank the application shell. Third-party scripts remain allowlisted;
 * broad https: fallbacks are limited to non-script resource classes.
 */
export function buildBaselineProductionCsp(nonce: string): string {
  return [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com https://pagead2.googlesyndication.com`,
    "style-src 'self' https://fonts.googleapis.com https://cookiehub.net https://cdn.cookiehub.eu",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "form-action 'self' https:",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ') + ';';
}

/**
 * ADR-0035 target policy. In report-only mode this is evaluated without blocking the UI;
 * promotion to enforced strict mode requires ADR-0040 production evidence.
 */
export function buildStrictProductionCsp(nonce: string): string {
  return [
    "default-src 'self' https:",
    "object-src 'none'",
    "base-uri 'none'",
    `script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`,
    "style-src 'self' https://fonts.googleapis.com https://cookiehub.net https://cdn.cookiehub.eu",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://ds.cookiehub.net https://consent.cookiehub.net https://region-eu.cookiehub.net https://consent-eu.cookiehub.net https://cookiehub.net https://cdn.cookiehub.eu https:",
    "frame-src 'self' https:",
    "worker-src 'self' blob:",
    "form-action 'self' https:",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; ') + ';';
}

function buildDevelopmentCsp(): string {
  // Vite HMR requires eval/inline/ws in development. This is never selected in production.
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
  return !req.path.startsWith('/api/') && !/\/[^/]+\.[a-z0-9]+$/i.test(req.path);
}

/**
 * Attaches the CSP/nonce response context to one Express request.
 *
 * `server.ts` still contains a legacy CSP setter. Until the active server-composition work is
 * reconciled, this module remains the authoritative response boundary and normalizes only the
 * two CSP header names. Other response headers are left untouched.
 */
export function attachSecurityResponseContext(req: Request, res: Response): void {
  const nonce = createRequestNonce();
  res.locals.cspNonce = nonce;

  const production = process.env.NODE_ENV === 'production';
  const mode = production ? resolveProductionCspMode() : null;
  const baselineCsp = production ? buildBaselineProductionCsp(nonce) : buildDevelopmentCsp();
  const strictCsp = production ? buildStrictProductionCsp(nonce) : null;
  const enforcedCsp = production && mode === 'strict' ? strictCsp! : baselineCsp;
  const reportOnlyCsp = production && mode === 'report-only' ? strictCsp : null;

  const originalSetHeader = res.setHeader.bind(res);
  const originalRemoveHeader = res.removeHeader.bind(res);
  const originalWrite = res.write.bind(res) as any;
  const originalEnd = res.end.bind(res) as any;

  (res as any).setHeader = (name: string, value: string | number | readonly string[]) => {
    const normalizedName = String(name).toLowerCase();
    if (normalizedName === 'content-security-policy') {
      return originalSetHeader(name, enforcedCsp);
    }
    if (normalizedName === 'content-security-policy-report-only') {
      if (reportOnlyCsp) return originalSetHeader(name, reportOnlyCsp);
      originalRemoveHeader(name);
      return res;
    }
    return originalSetHeader(name, value);
  };

  originalSetHeader('Content-Security-Policy', enforcedCsp);
  if (reportOnlyCsp) {
    originalSetHeader('Content-Security-Policy-Report-Only', reportOnlyCsp);
  } else {
    originalRemoveHeader('Content-Security-Policy-Report-Only');
  }
  originalSetHeader('X-CSP-Policy', 'ADR-0035+ADR-0040');
  originalSetHeader('X-CSP-Mode', production ? mode! : 'development');

  const htmlNavigation = isLikelyHtmlNavigation(req);
  if (htmlNavigation) {
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
    // sendFile/static normally sets text/html before the first chunk. The navigation fallback
    // covers runtimes that decide the MIME type only after the stream begins.
    bufferHtml = contentType.includes('text/html') || (htmlNavigation && contentType === '');
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
    originalSetHeader('Content-Security-Policy', enforcedCsp);
    if (reportOnlyCsp) {
      originalSetHeader('Content-Security-Policy-Report-Only', reportOnlyCsp);
    } else {
      originalRemoveHeader('Content-Security-Policy-Report-Only');
    }

    const cb = typeof encoding === 'function' ? encoding : callback;
    return originalEnd(html, 'utf8', cb);
  };
}
