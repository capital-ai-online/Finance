// ADR-0003.5 — Rate-Limiting für Admin-/Auth-kritische Endpunkte.
//
// Bewusst ohne externe Abhängigkeit (z.B. express-rate-limit), um die
// Angriffsfläche durch Drittanbieter-Code nicht unnötig zu vergrößern -
// ein einfacher In-Memory-Zähler reicht für den aktuellen Single-Instance-
// Render-Deploy aus.
//
// WICHTIGE EINSCHRÄNKUNG: Der Zustand lebt im Prozessspeicher. Bei
// horizontaler Skalierung (mehrere Render-Instanzen/Worker) teilen sich
// die Instanzen den Zähler NICHT - jede Instanz limitiert unabhängig.
// Für Multi-Instance-Betrieb müsste der Zähler nach Redis/Supabase
// ausgelagert werden. Für den aktuellen Deployment-Stand (eine Instanz)
// ist das unkritisch, aber bei Skalierung erneut zu prüfen.

import { isIP } from 'node:net';
import {
  resolveCloudflareRenderEdgeTrust,
  type EdgeTrustOptions,
} from './edgeTrust';

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodische Bereinigung, damit die Map nicht unbegrenzt wächst.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > 60 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref?.();

/**
 * Fixed-Window-Zähler. Gibt true zurück, wenn die Anfrage noch im erlaubten
 * Rahmen liegt (und zählt sie mit), false wenn das Limit überschritten ist.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/** Für Diagnose-/Testzwecke: aktuellen Zählerstand zurücksetzen. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

function validatedIp(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  return isIP(candidate) > 0 ? candidate : null;
}

export interface ClientIpResolutionOptions extends EdgeTrustOptions {}

/**
 * Resolves the effective client IP without trusting caller-controlled forwarding headers.
 *
 * On Render, Cloudflare visitor identity is accepted only after the Cloudflare -> Render
 * provenance contract passes. Missing/mismatched edge proof fails closed to the direct peer
 * identity. This deliberately avoids raw X-Forwarded-For and prevents direct-origin callers from
 * choosing another rate-limit/audit identity by spoofing CF-Connecting-IP.
 */
export function getClientIp(
  req: { headers: Record<string, unknown>; socket?: { remoteAddress?: string }; ip?: string },
  options: ClientIpResolutionOptions = {},
): string {
  const edgeTrust = resolveCloudflareRenderEdgeTrust(req, options);
  if (edgeTrust.state === 'trusted-cloudflare-render' && edgeTrust.clientIp) {
    return edgeTrust.clientIp;
  }

  // Ohne explizite Proxy-Vertrauensregel entspricht req.ip dem direkten Socket-Peer. Das ist für
  // lokale/non-Render Umgebungen und für fail-closed Edge-Fallbacks die engste verfügbare Quelle.
  const expressIp = validatedIp(req.ip);
  if (expressIp) return expressIp;

  const socketIp = validatedIp(req.socket?.remoteAddress);
  return socketIp ?? 'unknown';
}
