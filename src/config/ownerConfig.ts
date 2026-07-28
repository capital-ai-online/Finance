/**
 * Zentrale Owner-/Kontakt-Konfiguration.
 *
 * Hintergrund: Vorher war die private E-Mail-Adresse des Eigentümers
 * (sven.kulessa@gmail.com) an mehreren Stellen im Frontend-Bundle
 * hardcodiert (AdminPanel.tsx, Dashboard.tsx, DocumentHygienePanel.tsx).
 * Das Frontend-Bundle ist öffentlich einsehbar (Browser-Devtools, "View
 * Source"), daher landete die private Adresse faktisch öffentlich im
 * Netz. Diese Datei bündelt alle UI-sichtbaren Owner-Referenzen an
 * einer Stelle und trennt strikt:
 *   - OWNER_DISPLAY_NAME / OWNER_SUPPORT_EMAIL: öffentliche,
 *     geschäftliche Kontaktdaten (capital-ai.online), unproblematisch
 *     im Bundle.
 *   - Keine private Adresse mehr im Quellcode. Falls eine private
 *     Eskalationsadresse für den Owner-only-Bereich benötigt wird,
 *     gehört sie serverseitig (z.B. als ENV-Variable) hinterlegt,
 *     nicht in den Client-Code.
 *
 * Autorisierung bleibt davon unberührt: Zugriffskontrolle läuft
 * ausschließlich serverseitig über iam_role (siehe authMiddleware.ts),
 * niemals über einen E-Mail-String-Vergleich im Frontend.
 */

export const OWNER_DISPLAY_NAME = 'Sven Kulessa';

// Öffentliche geschäftliche Kontaktadresse - bewusst NICHT die private
// gmail-Adresse. Diese Domain-Adresse darf im Client-Bundle erscheinen.
export const OWNER_SUPPORT_EMAIL = 'sven.kulessa@capital-ai.online';

export const SUPPORT_EMAIL = 'support@capital-ai.online';

/**
 * Demo-/Mock-Daten für lokale Entwicklung und UI-Vorschau.
 * Explizit als Fantasie-Daten gekennzeichnet - keine echten Nutzer,
 * keine echten E-Mail-Adressen. Falls diese Liste jemals durch einen
 * echten Supabase-Query ersetzt wird, kann dieser Block komplett
 * entfallen.
 */
export const DEMO_MOCK_USERS_DISCLAIMER =
  'Demo-Daten - keine echten Nutzerkonten. Zur produktiven Nutzung durch Supabase-Query ersetzen.';
