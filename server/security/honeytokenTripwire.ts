// GitGuardian-Honeytoken — Tripwire fuer die Verwendung gegen die eigene API.
//
// GitGuardian meldet, wenn der ausgelegte Decoy-Key gegen AWS benutzt wird. Was GitGuardian nicht
// sieht: jemand probiert das gefundene Credential gegen *unsere* Endpunkte aus. Genau diese Luecke
// schliesst dieses Modul.
//
// Zwei Regeln bestimmen das Verhalten:
//
// 1. **Die Antwort aendert sich nicht.** Ein Treffer wird ausschliesslich protokolliert; der
//    Request laeuft unveraendert weiter und erhaelt dieselbe Antwort wie ohne Honeytoken. Wuerde
//    der Server anders reagieren, koennte ein Angreifer das Decoy identifizieren und meiden —
//    der Mechanismus wuerde sich selbst entwerten.
//
// 2. **Der Kanal bleibt sauber.** Nur echte Credential-Treffer erzeugen `honeytoken_touched`.
//    Scanner-Pfade, fehlgeschlagene Logins und CORS-Blocks haben eigene Ereignistypen. Ein
//    Honeytoken ist nur solange wertvoll, wie ein Treffer ohne Nachdenken als Vorfall gilt.

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getServerSupabase, isSupabaseConfigured } from '../db';
import { getClientIp } from '../../src/platform/Security/rateLimiter';
import { createLogger } from '../logger';
import { createIamAuditDebounce, buildDebounceKey } from '../../src/platform/Security/iamAuditDebounce';
import {
  type HoneytokenDefinition,
  describeHoneytokenMatch,
  honeytokenFingerprints,
  loadHoneytokenConfiguration,
} from './honeytoken';

const honeytokenLogger = createLogger('honeytoken');

// Header, in denen ein gefundenes Credential ueblicherweise ausprobiert wird. Der Body wird
// bewusst NICHT durchsucht: dieser Hook laeuft vor express.json(), und ein Roh-Body-Scan auf
// jedem Request waere ein Aufwands- und Speicherrisiko ohne nennenswerten Erkennungsgewinn.
const SCANNED_HEADERS = [
  'authorization',
  'x-api-key',
  'x-amz-security-token',
  'x-aws-access-key-id',
  'x-access-key',
  'x-auth-token',
  'apikey',
] as const;

export type HoneytokenSurface = 'header' | 'query';

export interface HoneytokenHit {
  surface: HoneytokenSurface;
  /** Header-Name bzw. Query-Parameter, in dem der Treffer lag. Nie das Material selbst. */
  location: string;
  component: 'access-key-id' | 'secret' | 'unknown';
}

function headerValues(req: Request, name: string): string[] {
  const raw = req.headers[name];
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map(String) : [String(raw)];
}

/**
 * Sucht die Fingerprints in Headern und Query-String.
 *
 * Gibt den ersten Treffer zurueck; mehr wird nicht gebraucht, weil bereits ein einziger Treffer
 * den Vorfall begruendet.
 */
export function detectHoneytokenInRequest(
  req: Request,
  definition: HoneytokenDefinition,
): HoneytokenHit | null {
  const fingerprints = honeytokenFingerprints(definition);

  for (const header of SCANNED_HEADERS) {
    for (const value of headerValues(req, header)) {
      for (const fingerprint of fingerprints) {
        if (value.includes(fingerprint)) {
          return {
            surface: 'header',
            location: header,
            component: describeHoneytokenMatch(definition, fingerprint),
          };
        }
      }
    }
  }

  const query = (req.query || {}) as Record<string, unknown>;
  for (const [key, rawValue] of Object.entries(query)) {
    const values = Array.isArray(rawValue) ? rawValue.map(String) : [String(rawValue ?? '')];
    for (const value of values) {
      for (const fingerprint of fingerprints) {
        if (value.includes(fingerprint)) {
          return {
            surface: 'query',
            location: key,
            component: describeHoneytokenMatch(definition, fingerprint),
          };
        }
      }
    }
  }

  return null;
}

// Ein Angreifer, der das Credential in einer Schleife durchprobiert, darf security_events nicht
// fluten — dieselbe Lehre wie aus F-01. Das Fenster ist kurz gehalten, weil Honeytoken-Treffer
// selten und einzeln aussagekraeftig sind; der Zaehler unterdrueckter Wiederholungen reist mit.
const HONEYTOKEN_EVENT_WINDOW_MS = 60_000;
const honeytokenEventDebounce = createIamAuditDebounce(HONEYTOKEN_EVENT_WINDOW_MS);

export async function recordHoneytokenHit(
  req: Request,
  definition: HoneytokenDefinition,
  hit: HoneytokenHit,
): Promise<void> {
  const ip = getClientIp(req as never);
  const userAgent = String(req.headers['user-agent'] || '') || null;

  // Immer loggen: das Operational-Log ist von der Datenbankverfuegbarkeit unabhaengig, und ein
  // Honeytoken-Treffer darf nicht daran scheitern, dass Supabase gerade nicht erreichbar ist.
  honeytokenLogger.error('Honeytoken verwendet', {
    eventName: 'honeytoken.touched',
    signal: 'security',
    stage: 'request-intake',
    outcome: 'detected',
    honeytokenId: definition.id,
    surface: hit.surface,
    location: hit.location,
    component: hit.component,
    method: req.method,
    path: req.path,
  });

  if (!isSupabaseConfigured()) return;

  const decision = honeytokenEventDebounce.decide(
    buildDebounceKey({ role: 'honeytoken', zone: hit.location, reason: hit.component, ip }),
  );
  if (!decision.write) return;

  const suppressedSuffix =
    decision.suppressedSincePrevious > 0
      ? ` (+${decision.suppressedSincePrevious} weitere Treffer im Fenster unterdrueckt)`
      : '';

  try {
    const supabase = getServerSupabase();
    await supabase.from('security_events').insert({
      event_type: 'honeytoken_touched',
      ip_address: ip && ip !== 'unknown' ? ip : null,
      user_agent: userAgent,
      attempted_email: null,
      endpoint: req.path,
      outcome: 'detected',
      // Enthaelt bewusst kein Secret-Material - nur ID, Fundstelle und Art des Treffers.
      reason: `honeytoken=${definition.id} surface=${hit.surface} location=${hit.location} component=${hit.component}${suppressedSuffix}`,
    });
  } catch (err: unknown) {
    honeytokenLogger.error('security_events-Insert fuer Honeytoken fehlgeschlagen', {
      eventName: 'honeytoken.persist_failed',
      signal: 'security',
      outcome: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Registrierbare Middleware. Ist kein Honeytoken konfiguriert, ist sie ein reiner Durchreicher.
 */
export function createHoneytokenTripwire(
  env: NodeJS.ProcessEnv = process.env,
): RequestHandler {
  const configuration = loadHoneytokenConfiguration(env);

  if (!configuration.configured) {
    if (configuration.reason && configuration.reason !== 'not-configured') {
      // Eine kaputte Konfiguration wuerde stillschweigend nie ausloesen - das muss sichtbar sein.
      honeytokenLogger.warn('Honeytoken ist konfiguriert, aber unbrauchbar - Tripwire inaktiv', {
        eventName: 'honeytoken.configuration_invalid',
        signal: 'security',
        outcome: 'inactive',
        reason: configuration.reason,
      });
    }
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  const definition = configuration.definition!;

  return (req: Request, _res: Response, next: NextFunction) => {
    let hit: HoneytokenHit | null = null;
    try {
      hit = detectHoneytokenInRequest(req, definition);
    } catch (err: unknown) {
      honeytokenLogger.error('Honeytoken-Erkennung fehlgeschlagen', {
        eventName: 'honeytoken.detection_failed',
        signal: 'security',
        outcome: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Der Request wird nicht blockiert und nicht verzoegert: die Antwort muss identisch zu der
    // ohne Honeytoken sein, sonst wird das Decoy fuer den Angreifer erkennbar.
    if (hit) {
      void recordHoneytokenHit(req, definition, hit);
    }

    next();
  };
}
