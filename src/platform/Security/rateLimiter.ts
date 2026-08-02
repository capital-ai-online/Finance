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

export function getClientIp(req: { headers: Record<string, unknown>; socket?: { remoteAddress?: string }; ip?: string }): string {
  // Render terminiert TLS und setzt x-forwarded-for; erstes Element ist die echte Client-IP.
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
