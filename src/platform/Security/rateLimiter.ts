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
  // SECURITY (2026-08-25 architecture review, finding #7): vormals wurde x-forwarded-for hier
  // direkt und ungeprueft geparst, ohne dass Express eine trust-proxy-Konfiguration hatte - ein
  // Client konnte durch einen beliebigen x-forwarded-for-Wert jedes Mal eine neue Rate-Limit-
  // Bucket-Identitaet erzeugen. server.application.ts setzt jetzt `app.set('trust proxy', 1)'
  // fuer den einzigen echten Reverse-Proxy (Render); req.ip beruecksichtigt das bereits korrekt
  // und darf nicht mehr durch eine eigene, davon unabhaengige Header-Auswertung umgangen werden.
  // req.ip ist nur vorhanden, wenn der Request ueber Express lief (nicht bei Tests mit einem
  // reinen Mock-Request) - dafuer bleibt der eigene Header-Fallback als reine Kompatibilitaet.
  if (req.ip) {
    return req.ip;
  }
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}
