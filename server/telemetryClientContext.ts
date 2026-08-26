// F-02 — Korrelationsmerkmale für die HTTP-Telemetrie.
//
// Problem laut Sicherheitsreport: `request.completed` protokollierte weder Quell-IP noch
// User-Agent. Scanner-Verkehr auf der HTTP-Ebene (Render-App-Logs) und Abweisungen auf der
// Auth-Ebene (Supabase `iam_access_log`) besaßen damit keinen gemeinsamen Schlüssel, und eine
// hybride, mehrstufige Angriffskampagne ließ sich weder belegen noch ausschließen.
//
// Datenschutz: die Render-App-Logs sind eine Drittanbieter-Senke ohne die projekteigenen
// Retention-Kontrollen (`retention_hold_until` o. Ä.). Eine rohe IP gehört dort nicht hinein.
// Stattdessen:
//
//   - `clientIpHash`  — tagesweise gesalzener SHA-256, auf 16 Hex-Zeichen gekürzt. Innerhalb
//                       eines Tages korrelierbar, nicht umkehrbar, über Tagesgrenzen hinweg
//                       nicht verkettbar.
//   - `clientNetwork` — grobes Präfix (IPv4 /24, IPv6 /48) für „selbes Netz"-Auswertungen,
//                       ohne den einzelnen Host zu identifizieren.
//   - `userAgent`     — auf 120 Zeichen gekürzt; reicht für Scanner-Fingerprinting.
//
// Für die Korrelation mit `iam_access_log` wird dessen roher `ip_address`-Wert mit demselben
// Tagessalz gehasht; die Verknüpfung ist dadurch möglich, ohne die Senke zu erweitern.

import crypto from 'node:crypto';
import { isIP } from 'node:net';

const USER_AGENT_MAX_LENGTH = 120;

// Ohne konfiguriertes Salz wird ein prozesslokales Zufallssalz erzeugt. Das hält die Hashes
// innerhalb einer Instanz korrelierbar, verhindert aber Wörterbuchangriffe auf den kleinen
// IPv4-Raum. Für instanzübergreifende Korrelation muss TELEMETRY_IP_HASH_SALT gesetzt sein.
const FALLBACK_SALT = crypto.randomBytes(32).toString('hex');

export function resolveIpHashSalt(env: NodeJS.ProcessEnv = process.env): string {
  const configured = String(env.TELEMETRY_IP_HASH_SALT || '').trim();
  return configured.length > 0 ? configured : FALLBACK_SALT;
}

/** UTC-Tagesschlüssel — rotiert das Salz und begrenzt die Verkettbarkeit auf 24 Stunden. */
export function utcDayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function hashClientIp(
  ip: string | null | undefined,
  dayKey: string = utcDayKey(),
  salt: string = resolveIpHashSalt(),
): string | null {
  if (!ip || ip === 'unknown' || isIP(ip) === 0) return null;
  return crypto
    .createHash('sha256')
    .update(`${salt}|${dayKey}|${ip}`)
    .digest('hex')
    .slice(0, 16);
}

/** IPv4 auf /24, IPv6 auf /48 kürzen. Gibt null zurück, wenn die Eingabe keine gültige IP ist. */
export function clientNetworkPrefix(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const version = isIP(ip);

  if (version === 4) {
    const octets = ip.split('.');
    if (octets.length !== 4) return null;
    return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
  }

  if (version === 6) {
    // Erste drei Hextets = /48. Ein "::" wird dabei nicht expandiert; führende Gruppen genügen.
    const groups = ip.split(':').slice(0, 3);
    if (groups.some((group) => group === '')) return null;
    return `${groups.join(':')}::/48`;
  }

  return null;
}

export function truncateUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const normalized = String(userAgent).trim();
  if (normalized.length === 0) return null;
  return normalized.length > USER_AGENT_MAX_LENGTH
    ? normalized.slice(0, USER_AGENT_MAX_LENGTH)
    : normalized;
}

export interface TelemetryClientContext {
  clientIpHash: string | null;
  clientNetwork: string | null;
  userAgent: string | null;
}

export function buildTelemetryClientContext(
  ip: string | null | undefined,
  userAgent: string | null | undefined,
): TelemetryClientContext {
  return {
    clientIpHash: hashClientIp(ip),
    clientNetwork: clientNetworkPrefix(ip),
    userAgent: truncateUserAgent(userAgent),
  };
}
