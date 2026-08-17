# M10 — Phase 3 Live-Wiring: Owner Passkey Enrollment (2026-08-17)

Status: PHASE 3 LIVE-WIRED AND TESTED — **kein echtes Owner-Enrollment hat stattgefunden**
(strukturell unmöglich für einen Agenten); Migration noch nicht gegen eine echte
Supabase-Instanz angewendet
Authority: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` §„Phase 3"; ADR-0066 §7, §9;
Owner-Wahl „Live-Wiring jetzt bauen (empfohlen)" via `AskUserQuestion`, 2026-08-17, im Anschluss an
die Owner-Anfrage „Passkey enrollment" und die Feststellung, dass Phase 3 zuvor nur als
nicht-erreichbarer Code existierte.

## 0. Zweck und Abgrenzung

Verdrahtet die bereits getestete Phase-3-Logik (`server/m10/credentialEnrollment.ts`, PR #410)
hinter einem echten, authentifizierten HTTP-Endpunkt, einer echten Supabase-Persistenz und einer
minimalen Owner-UI — der letzte Baustein, bevor der Owner selbst tatsächlich einen Passkey
registrieren könnte. Reichweite:

- ✅ Supabase-Migration für zwei neue Tabellen (`m10_registration_challenges`,
  `m10_owner_credentials`).
- ✅ Supabase-gestützte Implementierungen der `M10RegistrationChallengeStore`/
  `M10CredentialStore`-Schnittstellen aus Phase 3.
- ✅ Echter, Owner+Step-up-gated HTTP-Endpunkt (`/api/m10/credential-enrollment/*`).
- ✅ Minimale Owner-UI (neuer Tab „Passkey-Autorisierung (M10)" im Supervisor-Dashboard), die
  `@simplewebauthn/browser`s `startRegistration()` aufruft.
- ❌ **Kein echtes Owner-Enrollment fand statt.** Das bleibt strukturell unmöglich für einen
  Agenten — es erfordert einen echten Browser und einen echten Authenticator des Owners.
- ❌ Die Migration wurde **nicht** gegen eine echte Supabase-Instanz angewendet (CLAUDE.md:
  keine direkte Produktions-Supabase-Mutation aus einem Dev-Schritt) — sie wird durch den
  bestehenden Deploy-Prozess angewendet, sobald dieser PR gemergt ist, exakt wie jede andere
  Migration in `supabase/migrations/`.
- ❌ M10-Exit-Gate-Punkt 2 gilt weiterhin nicht als erfüllt.
- ❌ ADR-0066 bleibt `PROPOSED`.

## 1. Neue Dependency: `@simplewebauthn/browser`

Client-seitiges Gegenstück zu `@simplewebauthn/server` (bereits Owner-autorisiert in PR #410).
Version `^13.3.0`, `npm audit --omit=dev --audit-level=high`: **0 Schwachstellen**. Ruft
`navigator.credentials.create()` über eine geprüfte Bibliothek statt einer Eigenimplementierung
auf — konsistent mit der bereits getroffenen Owner-Entscheidung für die Server-Seite.

## 2. Supabase-Migration

`supabase/migrations/20260817020000_m10_passkey_owner_enrollment.sql` (neu) — mirror-strukturiert
nach `20260731000400_security_events_stepup_totp.sql` und
`20260810002200_agent_action_approvals.sql` (Service-Role-only RLS, keine Client-Policy):

- `m10_registration_challenges`: `challenge_id` (Primärschlüssel), `challenge`, `owner_actor_id`
  (REM/IAM-String-Actor-ID, nicht die Supabase-`auth.users`-UUID — dieses System hat genau einen
  kanonischen Owner, und jede M10-Autorisierungsprüfung bindet bereits an dieselbe Konstante),
  `issued_at`, `expires_at`, `consumed_at`.
- `m10_owner_credentials`: `credential_id`, `owner_actor_id`, `public_key`, `counter`,
  `transports`, `device_type`, `backed_up`, `aaguid`, `created_at`, `revoked_at`. **Kein Feld
  könnte je einen privaten Schlüssel, ein rohes Attestation-Objekt oder biometrische Daten
  aufnehmen** — das Schema selbst erzwingt ADR-0066 §7, nicht nur die Anwendungslogik.
- Beide Tabellen: RLS aktiviert, ausschließlich `service_role_full_access`-Policy — kein
  Client-/Anon-Zugriff, identisch zu `step_up_tokens`/`agent_action_approvals`.
- **Migration wurde nicht gegen eine echte Instanz angewendet** — wird beim Merge durch den
  bestehenden Deploy-Prozess ausgerollt.

## 3. Supabase-gestützte Stores

`server/m10/credentialEnrollmentSupabaseStore.ts` (neu) — implementiert die in
`credentialEnrollment.ts` (Phase 3) bereits definierten Schnittstellen, bewusst als **separate
Datei** (spiegelt die Trennung `breakGlass.ts`/`breakGlassRouter.ts`): `credentialEnrollment.ts`
bleibt frei von I/O-Imports, weiterhin mit den In-Memory-Referenzstores testbar.

- `markConsumed`/`revoke`: exakt dasselbe atomare `UPDATE ... WHERE ... IS NULL`-Muster wie
  `requireStepUp()` und `consumeApproval()` — ein Replay-Versuch gegen eine bereits verbrauchte
  Challenge oder ein bereits widerrufenes Credential kann nie zwei Gewinner haben.

## 4. HTTP-Endpunkt

`server/m10/credentialEnrollmentRouter.ts` (neu), gemountet unter
`/api/m10/credential-enrollment` in `registerApplicationRoutes.ts`:

- `POST /begin`, `POST /complete`, `POST /revoke`: jeweils Owner-Rolle **und** frischer Step-up
  erforderlich (`requireOwnerWithStepUp`, mirror-strukturiert wie `breakGlassRouter.ts`), jeweils
  mit eigenem, bereits eindeutigem Zone-String als `purpose` (M9-Independent-Review-Fix F2
  konsequent angewendet: `systemadmin:m10-passkey-enroll-begin`/`-complete`/`-revoke`).
  `POST /begin` zusätzlich Rate-Limit-geschützt (5 Versuche/5 Minuten pro IP).
- `GET /credentials`: Owner-only, **kein** Step-up (reiner Lesezugriff, mirror-strukturiert wie
  `breakGlassRouter.ts`s `/status`).
- Jede Aktion schreibt ein Audit-Event über den bereits bewiesenen `writeAgentAuditEvent`-Pfad.
- **Bewusste Entscheidung, beide mutierenden Schritte (Begin UND Complete) separat step-up-gated
  zu lassen** statt nur den ersten — mehr Reibung für den Owner (zwei TOTP-Eingaben pro
  Enrollment), aber Defense-in-Depth konsistent mit dem in dieser Sitzung durchgehend verfolgten
  Prinzip, nie zu lockern, wenn ein zusätzlicher Schutz ohne funktionalen Nachteil möglich ist.

## 5. Minimale Owner-UI

`src/components/M10PasskeyEnrollmentPanel.tsx` (neu) + neuer Tab „Passkey-Autorisierung (M10)" in
`src/components/SupervisorDashboard.tsx`:

- Orchestriert den vollständigen Ablauf: `POST /begin` → bei `428` `StepUpModal` (bereits
  bestehende, wiederverwendete Komponente) → `startRegistration()` (echte Browser-WebAuthn-
  Zeremonie) → `POST /complete` → bei erneutem `428` erneut `StepUpModal` → Erfolg/Fehler-Anzeige
  → Liste aktiver Credentials mit Widerruf-Aktion (ebenfalls step-up-gated).
- `browserSupportsWebAuthn()`-Feature-Detection mit Fallback-Hinweis für nicht unterstützte
  Browser.
- Reine UI-Ergänzung — kein neuer Auth-Mechanismus im Frontend, wiederverwendet `authFetch`
  (bestehender zentraler Auth-Fetch-Wrapper) und `isStepUpRequired`/`StepUpModal` unverändert.

## 6. Testabdeckung

28 neue Tests (zusätzlich zu den 20 aus PR #410 für die reine Logik-Ebene):

- `tests/unit/m10CredentialEnrollmentRouter.test.ts` (16 Tests) — mockt die bereits getesteten
  `credentialEnrollment.ts`-Funktionen sowie `checkAdminAccess`/`requireStepUp` (dieselbe Methodik
  wie `breakGlassRouter.test.ts`): Owner+Step-up-Gate auf jeder mutierenden Route, korrekte
  Purpose-Zone je Aktion, Rate-Limit nach 5 Versuchen, Audit-Event bei ALLOW und DENY,
  Lese-Route ohne Step-up-Anforderung.
- `tests/unit/m10CredentialEnrollmentSupabaseStore.test.ts` (12 Tests) — mockt
  `getPrivilegedServerSupabase`/`isPrivilegedSupabaseConfigured` (dieselbe Methodik wie
  `breakGlass.test.ts`): korrekte Tabellen-/Spalten-Bindung, atomare Einmal-Konsum-/Widerruf-
  Semantik, Fail-closed ohne konfiguriertes Supabase.

**Testlauf:** `npx vitest run` — **200 Dateien, 1292 Tests, alle PASS** (davon neu: 28).
`npm run lint` (`tsc --noEmit`) PASS. `npm audit --omit=dev --audit-level=high`: 0 Schwachstellen.
**Zusätzlich verifiziert:** `vite build` (Frontend-Produktionsbuild inkl. der neuen UI-Komponente)
und `esbuild server.ts ...` (Server-Bundle inkl. der neuen Router-/Store-Module) laufen beide
fehlerfrei durch.

## 7. Was dieses Dokument NICHT bedeutet

- **Kein echter Owner-Passkey wurde registriert.** Strukturell unmöglich für einen Agenten in
  dieser Sitzung.
- Die Supabase-Migration wurde nicht gegen eine echte Instanz angewendet/verifiziert — das
  geschieht erst beim Merge/Deploy.
- M10-Exit-Gate-Punkt 2 gilt weiterhin nicht als erfüllt.
- ADR-0066 bleibt `PROPOSED`.

## 8. Nächste Schritte (jeweils eigene Owner-Freigabe erforderlich)

1. **Das reale Owner-Enrollment selbst** — nach Merge/Deploy dieses PRs kann der Owner über den
   neuen Dashboard-Tab tatsächlich einen Passkey registrieren. Ausschließlich der Owner persönlich
   kann diesen Schritt durchführen.
2. Phase 4 — Assertion Verification (Authentifizierungs-Zeremonie für `AUTHORIZE_PR_CI`).
3. Live-Wiring der Phasen 1+2 hinter eigenen HTTP-Endpunkten.

## Related Documents

- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/evidence/m10/M10_PHASE3_OWNER_CREDENTIAL_ENROLLMENT_2026-08-17.md`
- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`
- `supabase/migrations/20260817020000_m10_passkey_owner_enrollment.sql`
- `server/m10/credentialEnrollmentRouter.ts`
- `server/m10/credentialEnrollmentSupabaseStore.ts`
- `src/components/M10PasskeyEnrollmentPanel.tsx`
- `tests/unit/m10CredentialEnrollmentRouter.test.ts`
- `tests/unit/m10CredentialEnrollmentSupabaseStore.test.ts`
