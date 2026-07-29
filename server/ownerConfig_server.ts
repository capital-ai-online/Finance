import { getCleanEnv } from './env';

/**
 * Serverseitige Owner-/Kontakt-Konfiguration.
 *
 * Hintergrund: Die private E-Mail-Adresse des Eigentümers war an
 * mehreren Stellen im Backend hardcodiert - u.a. als Default-Autor für
 * automatisierte Versions-Events (versionManager.ts), in Seed-Log-
 * Einträgen (systemEvents.ts) und als Allowlist im PII-Sanitizer
 * (documentHygiene.ts). Zusätzlich referenzierte ein generiertes
 * Entwickler-/KI-Agenten-Dokument (KNOWLEDGE_BASE.md) noch das alte,
 * unsichere "?email=..."-Query-Parameter-Muster, das serverseitig
 * bereits abgeschafft wurde (siehe authMiddleware.ts).
 *
 * Diese Datei bündelt die Werte und liest sie primär aus
 * Umgebungsvariablen. Die Literale dienen nur als Fallback, damit sich
 * das Verhalten nicht ändert, solange die ENV-Variablen in Render noch
 * nicht gesetzt sind. Empfehlung: OWNER_BUSINESS_EMAIL,
 * OWNER_LEGACY_EMAILS und OWNER_DEFAULT_AUTHOR_EMAIL in Render als
 * echte ENV-Variablen hinterlegen und die Fallback-Literale danach
 * entfernen, damit keine private Adresse mehr im Git-Verlauf steht.
 */

export const OWNER_DISPLAY_NAME = getCleanEnv('OWNER_DISPLAY_NAME') || 'Sven Kulessa';

// Öffentliche geschäftliche Kontaktadresse - unproblematisch in Logs/Docs.
export const OWNER_BUSINESS_EMAIL =
  getCleanEnv('OWNER_BUSINESS_EMAIL') || 'sven.kulessa@capital-ai.online';

/**
 * Default-Autor für automatisiert ausgelöste System-/Versions-Events
 * (z.B. wenn kein Nutzer explizit eine Aktion ausgelöst hat).
 * Bewusst NICHT die private gmail-Adresse - Systemaktionen sollen der
 * öffentlichen Geschäftsadresse zugeordnet werden, nicht der privaten.
 */
export const OWNER_DEFAULT_AUTHOR_EMAIL =
  getCleanEnv('OWNER_DEFAULT_AUTHOR_EMAIL') || OWNER_BUSINESS_EMAIL;

/**
 * Allowlist für den PII-Sanitizer (documentHygiene.ts, Regel DOC-04):
 * Adressen, die trotz Regex-Treffer NICHT als unmaskierte Kunden-PII
 * gemeldet/maskiert werden, weil es sich um bekannte Eigentümer- bzw.
 * interne Test-Adressen handelt. Kommagetrennt über ENV überschreibbar.
 */
export const OWNER_ALLOWLISTED_EMAILS: string[] = (
  getCleanEnv('OWNER_LEGACY_EMAILS') ||
  'sven.kulessa@gmail.com,sven.kulessa@gmx.net,sven.kulessa@capital-ai.online,customer_trial@gmail.com'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isOwnerAllowlistedEmail(email: string): boolean {
  return OWNER_ALLOWLISTED_EMAILS.includes(email.trim().toLowerCase());
}
