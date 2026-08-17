# M10 — Phase 3: Owner Credential Enrollment (2026-08-17)

Status: PHASE 3 CODE/LOGIC IMPLEMENTED AND TESTED — **kein echtes Owner-Enrollment hat
stattgefunden** (kann laut Runbook grundsätzlich nie von einem Agenten durchgeführt werden), **nicht**
live-wired, **nicht** eine abgeschlossene M10-Phase im Exit-Gate-Sinn
Authority: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` §„Phase 3 — Owner Credential
Enrollment"; ADR-0066 §4, §7, §9; ESS-0022 §9-10; Threat Model „Recovery Threats"; Owner-Wahl
„@simplewebauthn/server hinzufügen (empfohlen)" via `AskUserQuestion`, 2026-08-17, gefolgt von
„start Phase 3", im Anschluss an `docs/evidence/m10/M10_PHASE2_CHALLENGE_ISSUANCE_2026-08-17.md`.

## 0. Zweck und Abgrenzung

Implementiert den Code/die Logik, die ein Owner selbst nutzen würde, um einen Passkey zu
registrieren — **nicht** die eigentliche Registrierung selbst. Das Runbook ist hier eindeutig:
„Owner passkey enrollment is a Human/Owner identity operation ... Agents may assist with UI/code
but cannot autonomously enroll, replace or revoke Owner credentials." Reichweite exakt danach
begrenzt:

- ✅ Registrierungs-Zeremonie-Orchestrierung (`server/m10/credentialEnrollment.ts`) — implementiert
  und getestet, mit echter WebAuthn-Kryptographie-Verifikation über eine etablierte Bibliothek.
- ✅ Widerruf-Funktion (`revokeM10Credential`) — Code, den nur eine reale, separat authentifizierte
  Owner-Aktion aufrufen darf, niemals ein Agent von sich aus.
- ❌ **Kein** echtes Owner-Enrollment fand statt — kein realer Passkey wurde registriert, kein
  realer Browser/Authenticator war beteiligt. Alle Tests mocken die WebAuthn-Bibliotheksfunktionen.
- ❌ **Kein** HTTP-Endpunkt, **keine** `server.application.ts`-Verdrahtung, **keine** Frontend-UI.
- ❌ **Keine** Produktions-Persistenz-Entscheidung — In-Memory-Referenzimplementierungen für Tests.
- ❌ M10-Exit-Gate-Punkt 2 gilt weiterhin **nicht** als erfüllt.
- ❌ ADR-0066 bleibt `PROPOSED`.

## 1. Neue Dependency: `@simplewebauthn/server`

**Owner-Entscheidung, nicht unilateral getroffen:** Vor jeder Implementierung wurde der Owner
explizit gefragt, ob eine WebAuthn-Bibliothek hinzugefügt werden soll (via `AskUserQuestion`),
mit der Begründung, dass echte Attestation-Verifikation (COSE-Key-Parsing, CBOR-Dekodierung,
Signaturprüfung) für eine sicherheitskritische Kryptographie-Routine nicht von Hand implementiert
werden sollte — anders als Phase 1, wo ein dünner `fetch()`-Wrapper für die GitHub-REST-API
bewusst ausreichte und keine neue Dependency rechtfertigte. Owner-Wahl: „@simplewebauthn/server
hinzufügen (empfohlen)".

- Version `^13.3.2`, `npm install` ausgeführt, `npm audit --omit=dev --audit-level=high`:
  **0 Schwachstellen**.
- Sub-Dependencies (`@hexagon/base64`, `@levischuck/tiny-cbor`, `@peculiar/asn1-*`,
  `@peculiar/x509`) sind etablierte, weit verbreitete Krypto-/ASN.1-Bibliotheken derselben
  Publisher-Familie — Standard-Abhängigkeitsbaum für WebAuthn-Server-Implementierungen.
- Node-Engine-Kompatibilität geprüft (`>=20.0.0`, erfüllt vom Projekt-Minimum `>=24.18.0`).

## 2. Implementierung

`server/m10/credentialEnrollment.ts` (neu):

- **RP-Konfiguration:** `M10_RP_ID = 'capital-ai.online'`, `M10_EXPECTED_ORIGINS` — spiegeln
  bewusst `server/middleware/cors.ts`s bereits bestehende `PRODUCTION_ORIGINS`-Liste (dort nicht
  exportiert, daher als eigenes Literal gehalten; eine künftige Drift würde durch WebAuthns
  Origin-Verifikation fail-closed abgefangen, nicht zu einer Schwächung führen).
- `beginM10CredentialEnrollment(ownerId, deps)`: **strukturelle Owner-Only-Durchsetzung** — lehnt
  jede `ownerId !== SYSTEMADMIN_OWNER_ACTOR_ID` sofort ab, ohne jede Bibliotheksfunktion
  aufzurufen (mirror-strukturiert wie `activateBreakGlass()`s Owner-Check). Verlangt explizit
  `authenticatorSelection: { userVerification: 'required', residentKey: 'required' }` — die
  Bibliothek selbst würde standardmäßig nur `'preferred'` verlangen, was ADR-0066 §4 Anforderung 9
  („User Verification (UV) required") nicht genügen würde. Schließt bereits registrierte aktive
  Credentials des Owners über `excludeCredentials` aus (keine doppelte Registrierung desselben
  Authenticators).
- `completeM10CredentialEnrollment(ownerId, challengeId, response, deps)`: verifiziert gegen
  `expectedRPID`/`expectedOrigin`/`requireUserVerification: true` und die exakte, zuvor
  ausgestellte Challenge. **Die Challenge wird bei jedem Verifikationsversuch verbraucht — auch bei
  Fehlschlag** (bewusste Entscheidung, um wiederholte gefälschte Antworten gegen dieselbe lebende
  Challenge zu verhindern; per Test bewiesen). Persistiert bei Erfolg **ausschließlich**
  Base64url-kodierten öffentlichen Schlüssel, `credentialId`, `counter`, `transports`,
  `deviceType`, `backedUp`, `aaguid` — niemals das rohe `attestationObject`, niemals einen
  privaten Schlüssel, niemals biometrische Daten (ADR-0066 §7 explizit).
- `revokeM10Credential(ownerId, credentialId, deps)`: Owner-only, atomarer
  aktiv-→-widerrufen-Übergang (ESS-0022 §9 „support credential revocation/re-enrollment").
- `M10RegistrationChallengeStore` / `M10CredentialStore`: austauschbare Schnittstellen, keine
  Produktions-Persistenz-Entscheidung getroffen — In-Memory-Referenzimplementierungen für Tests,
  exakt dasselbe Muster wie Phase 2. **Wichtiger Unterschied zu Phase 2 dokumentiert:** ein
  registriertes Credential muss anders als eine 2-Minuten-Challenge einen Server-Neustart
  überleben — die reale Backend-Wahl (voraussichtlich eine Supabase-Tabelle, mirror-strukturiert
  wie `step_up_tokens`) ist bewusst dem Live-Wiring-Schritt überlassen, nicht in diesem
  Logik-Schritt vorweggenommen.

`server/agentAudit/systemadminAuditedExecution.ts`: `server/m10/credentialEnrollment.ts` zur
`SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS`-Denylist hinzugefügt.

## 3. Testabdeckung

`tests/unit/m10CredentialEnrollment.test.ts` (neu), 20 Tests — echte WebAuthn-Bibliotheksfunktionen
(`generateRegistrationOptions`/`verifyRegistrationResponse`) werden gemockt (dieselbe Methodik wie
`checkAdminAccess`/`requireStepUp` in `breakGlassRouter.test.ts`), die eigene Orchestrierungslogik
läuft ungemockt:

- **Ausstellung** (6 Tests): Ablehnung bei Nicht-Owner ohne Bibliotheksaufruf; Ablehnung bei
  Bibliotheksfehler; Ablehnung bei ungültigem Zeitpunkt; Beweis, dass `userVerification: 'required'`
  und `residentKey: 'required'` tatsächlich übergeben werden (nicht nur behauptet); Beweis, dass
  bereits registrierte Credentials korrekt in `excludeCredentials` landen; korrekte Persistenz als
  `UNUSED` mit exakter TTL.
- **Abschluss** (8 Tests): Ablehnung bei Nicht-Owner ohne Store-Zugriff; unbekannte Challenge;
  Challenge für einen anderen Owner; abgelaufene Challenge; **Challenge wird bei Fehlschlag
  verbraucht, ein Retry gegen dieselbe Challenge schlägt fehl** (`verifyResponse` wird beim zweiten
  Versuch nachweislich gar nicht erst aufgerufen); Bibliotheksfehler; **erfolgreiche Registrierung
  persistiert exakt die erwarteten zehn Felder, nichts weiteres** (`Object.keys`-Gleichheitstest —
  verhindert versehentliches Mitpersistieren zusätzlicher, evtl. sensibler Felder); exakte
  RP-ID/Origin/UV-Bindung im Bibliotheksaufruf verifiziert.
- **Widerruf** (4 Tests): Ablehnung bei Nicht-Owner; unbekanntes Credential; erfolgreicher Widerruf
  entfernt aus der aktiven Liste; kein doppelter Widerruf.
- **Gültigkeitsprüfung** (2 Tests): Fenster- und Zustandssemantik, mirror-strukturiert wie Phase 2.

**Testlauf:** `npx vitest run` — **198 Dateien, 1264 Tests, alle PASS** (davon neu: 20).
`npm run lint` (`tsc --noEmit`) PASS. `npm audit --omit=dev --audit-level=high`: 0 Schwachstellen.

## 4. Was dieses Dokument NICHT bedeutet

- **Kein echter Owner-Passkey wurde registriert.** Das ist strukturell unmöglich für einen Agenten
  in dieser Sitzung durchzuführen — es erfordert einen realen Browser, einen realen Authenticator
  und eine reale Owner-Interaktion.
- Kein HTTP-Endpunkt, keine Frontend-UI existiert für diesen Code.
- Keine Produktions-Persistenz-Entscheidung für Credentials wurde getroffen.
- M10-Exit-Gate-Punkt 2 gilt weiterhin nicht als erfüllt.
- ADR-0066 bleibt `PROPOSED`.

## 5. Nächste Schritte (jeweils eigene Owner-Freigabe erforderlich)

1. Phase 4 — Assertion Verification (Authentifizierungs-Zeremonie, analog zu diesem
   Registrierungs-Code, aber für den `AUTHORIZE_PR_CI`-Anwendungsfall aus Phase 1/2).
2. Live-Wiring: HTTP-Endpunkte + Produktions-Persistenz-Entscheidung (Supabase-Tabelle für
   Credentials) + minimale Owner-Enrollment-UI.
3. Erst danach: das reale Owner-Enrollment selbst — ausschließlich durch den Owner persönlich.

## Related Documents

- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/evidence/m10/M10_PHASE1_TRUSTED_PR_STATE_RESOLVER_2026-08-17.md`
- `docs/evidence/m10/M10_PHASE2_CHALLENGE_ISSUANCE_2026-08-17.md`
- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`
- `server/m10/credentialEnrollment.ts`
- `tests/unit/m10CredentialEnrollment.test.ts`
