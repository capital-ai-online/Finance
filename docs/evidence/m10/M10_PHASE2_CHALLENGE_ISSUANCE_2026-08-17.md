# M10 — Phase 2: Challenge Issuance (2026-08-17)

Status: PHASE 2 IMPLEMENTED AND TESTED — **not** live-wired, **not** a completed M10 phase in the
Exit-Gate sense (Phases 3-6 + Controlled Cutover remain outstanding)
Authority: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` §„Phase 2 — Challenge Issuance";
ADR-0066 §3, §4; ESS-0022 §3; Threat Model „Canonical Authorization Context"; Owner-Wahl „start
Phase 2" nach expliziter Vorauswahl beider Optionen (Phase 2 vs. Phase-1-Live-Wiring), 2026-08-17,
im Anschluss an `docs/evidence/m10/M10_PHASE1_TRUSTED_PR_STATE_RESOLVER_2026-08-17.md`.

## 0. Zweck und Abgrenzung

Implementiert die zweite der sechs M10-Phasen: einen kryptographisch zufälligen, kurzlebigen,
Einmal-Challenge, gebunden an den von Phase 1 aufgelösten exakten PR-Zustand. Reichweite exakt wie
im Runbook §„Phase 2" beschrieben:

- ✅ Challenge-Erstellung, gebunden an den frisch (nicht caller-geliefert) aufgelösten PR-Kontext —
  implementiert und getestet.
- ✅ Persistenz-Schnittstelle, die laut Runbook „issue time, expiry, expected Owner, expected PR
  context digest, unused/consumed/revoked state" abbildet — als austauschbare `M10ChallengeStore`-
  Schnittstelle implementiert, nicht an eine konkrete Datenbank gebunden (siehe §2).
- ✅ Kanonischer Autorisierungs-Digest exakt nach der in ADR-0066 §3 empfohlenen Formel.
- ❌ **Keine** WebAuthn-Assertion-Verifikation (Phase 4), **kein** HTTP-Endpunkt, **keine**
  `server.application.ts`-Verdrahtung — bleiben separate, eigens zu autorisierende nächste
  Schritte.
- ❌ M10-Exit-Gate-Punkt 2 gilt weiterhin **nicht** als erfüllt.
- ❌ ADR-0066 bleibt `PROPOSED`.

## 1. Implementierung

`server/m10/challengeIssuance.ts` (neu):

- `issueM10Challenge(request, deps)`: ruft **intern** `resolveTrustedPrState()` (Phase 1) auf —
  nimmt selbst nur `{repository, prNumber}` entgegen, niemals einen bereits aufgelösten Kontext vom
  Aufrufer. Ein Challenge wird nur ausgestellt, wenn Phase 1 `RESOLVED` liefert; jeder `DENY`-Grund
  aus Phase 1 wird unverändert durchgereicht. Erzeugt `challengeId` und die rohen Challenge-Bytes
  über das bereits bestehende, wiederverwendete `generateOpaqueToken()` (`secretCrypto.ts`, `crypto.
  randomBytes(...).toString('base64url')`) — keine neue Zufallsquelle erfunden.
- **TTL bewusst kürzer als Step-up-Tokens:** `M10_CHALLENGE_TTL_MS = 2 Minuten` (gegenüber dem
  5-Minuten-Fenster von Step-up-Tokens) — eine WebAuthn-Zeremonie ist wenige Sekunden Interaktion
  mit einem bereits physisch anwesenden Authenticator, anders als das Eintippen eines TOTP-Codes.
- `M10ChallengeStore` (Schnittstelle, nicht Implementierung): `save`/`get`/`markConsumed`/`revoke`.
  `markConsumed`/`revoke` müssen bei einer echten Backend-Wahl atomar sein — exakt dasselbe Muster
  wie `requireStepUp()`s `UPDATE ... WHERE used_at IS NULL`.
- `createInMemoryM10ChallengeStore()`: Referenzimplementierung für Tests und als bereitstehende
  Option für einen künftigen Live-Wiring-Schritt — mirror-strukturiert wie
  `breakGlassRouter.ts`s `activeMandates`-Map (Single-Instance-Deployment bereits dokumentiert
  akzeptiert, siehe `M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md` §2). **Keine Produktions-
  Persistenz-Entscheidung wurde in diesem Schritt getroffen** — bewusst offen gelassen, um keine
  Datenbank-Schema-Mutation aus einem reinen Logik-Schritt vorwegzunehmen (CLAUDE.md).
- `isM10ChallengeValidForUse(record, now)`: reine Gültigkeitsprüfung, `state === 'UNUSED'` UND
  innerhalb `[issuedAt, expiresAt)` — mirror-strukturiert wie `isBreakGlassMandateActive()`.
- `computeCanonicalAuthorizationDigest(challenge)`: implementiert exakt die in ADR-0066 §3
  empfohlene Formel `SHA-256(repo || prNumber || baseSha || headSha || changedFileSetHash ||
  diffDigest || action || challengeId)`, über das bereits bestehende `hashOpaqueToken()`
  (`secretCrypto.ts`) — kein neuer Hash-Mechanismus. Hat in dieser Phase noch keinen Aufrufer
  (Verwendung folgt in Phase 4/Audit), aber die Eingaben dafür entstehen erstmals hier.

**Bewusste Entscheidung, den Challenge-Wert selbst nicht zu hashen:** anders als Step-up-Tokens
(deren Rohwert serverseitig nur gehasht gespeichert wird, weil ihr Besitz allein zur Aktion
berechtigt) ist ein WebAuthn-Challenge kein Bearer-Secret — er wird dem Browser ohnehin im Klartext
übergeben (`navigator.credentials.get()`); seine Sicherheit beruht auf dem privaten Schlüssel des
Authenticators, nicht auf Challenge-Vertraulichkeit. Klartext-Speicherung entspricht der Praxis
jeder realen WebAuthn-Bibliothek und ist im Code-Kommentar dokumentiert, um Verwechslung mit dem
Step-up-Token-Muster vorzubeugen.

`server/agentAudit/systemadminAuditedExecution.ts`: `server/m10/challengeIssuance.ts` zur
bestehenden `SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS`-Denylist hinzugefügt.

## 2. Warum keine Persistenz-Entscheidung in dieser Phase

Anders als bei Break-Glass (wo eine In-Memory-Lösung bewusst als **finale** Entscheidung begründet
wurde) bleibt die Store-Wahl für M10-Challenges hier **ausdrücklich offen**: die
`M10ChallengeStore`-Schnittstelle ist so geschnitten, dass sowohl eine In-Memory-Referenz
(aktuell) als auch eine spätere Supabase-gestützte Implementierung (beim Live-Wiring) sie erfüllen
können, ohne dass `issueM10Challenge()` selbst geändert werden müsste. Das vermeidet, eine
Produktionsschema-Entscheidung (neue Supabase-Tabelle für WebAuthn-Challenges) in einem reinen
Logik-Implementierungsschritt vorwegzunehmen — diese Entscheidung gehört zum Live-Wiring-Schritt,
zusammen mit der Frage, ob ein Multi-Instance-Deployment künftig eine andere Wahl als In-Memory
erfordert.

## 3. Testabdeckung

`tests/unit/m10ChallengeIssuance.test.ts` (neu), 18 Tests:

- **Ausstellung** (7 Tests): Ablehnung bei nicht auflösbarem PR-Zustand (Grund wird durchgereicht);
  Ablehnung außerhalb des Repository-Scopes ohne jeden GitHub-Aufruf; erfolgreiche Ausstellung mit
  korrektem Owner/Ziel-Kontext; Persistenz als `UNUSED`, abrufbar über `challengeId`; eindeutige
  `challengeId`/`challenge`-Werte über mehrere Ausstellungen; exakte 2-Minuten-Gültigkeitsdauer;
  Ablehnung bei ungültigem Ausstellungszeitpunkt.
- **Store-Lebenszyklus** (5 Tests): `markConsumed` transitioniert genau einmal
  `UNUSED → CONSUMED` (zweiter Versuch = Replay-Schutz, `false`); unbekannte `challengeId` liefert
  `false`; `revoke` transitioniert `UNUSED → REVOKED`, ein widerrufener Challenge kann danach nicht
  mehr konsumiert werden; ein bereits konsumierter Challenge kann nicht mehr widerrufen werden
  (Konsum gewinnt).
- **Gültigkeitsprüfung** (2 Tests): aktiv exakt innerhalb `[issuedAt, expiresAt)` nur bei `UNUSED`;
  `CONSUMED`/`REVOKED` sind immer ungültig, auch mitten im Zeitfenster.
- **Kanonischer Digest** (5 Tests): Determinismus; gültiges 64-Zeichen-Hex-SHA-256; ändert sich bei
  geändertem Head-SHA, geändertem Diff-Digest und geändertem `challengeId` — beweist, dass der
  Digest an den exakten Zustand UND die exakte Ceremony gebunden ist, nicht wiederverwendbar über
  verschiedene Challenges hinweg.

**Testlauf:** `npx vitest run` — **197 Dateien, 1244 Tests, alle PASS** (davon neu: 18).
`npm run lint` (`tsc --noEmit`) PASS.

## 4. Was dieses Dokument NICHT bedeutet

- M10-Exit-Gate-Punkt 2 gilt weiterhin **nicht** als erfüllt.
- Es existiert **keine** Persistenz-Entscheidung für die Produktion — nur eine Referenz-
  Implementierung für Tests.
- ADR-0066 bleibt `PROPOSED`.
- Kein HTTP-Endpunkt ruft `issueM10Challenge()` auf.

## 5. Nächste Schritte (jeweils eigene Owner-Freigabe erforderlich)

1. Phase 3 — Owner Credential Enrollment: zwingend Owner-only; Agenten dürfen laut Runbook nur bei
   UI/Code assistieren, niemals selbst registrieren.
2. Phase 4 — Assertion Verification (setzt eine reale WebAuthn-Verifikationsbibliothek und die
   Ergebnisse von Phase 3 voraus).
3. Live-Wiring der Phasen 1+2 hinter einem echten HTTP-Endpunkt, inkl. der noch offenen
   Persistenz-Entscheidung für `M10ChallengeStore`.

## Related Documents

- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/evidence/m10/M10_PHASE1_TRUSTED_PR_STATE_RESOLVER_2026-08-17.md`
- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`
- `server/m10/challengeIssuance.ts`
- `server/m10/githubPrStateResolver.ts`
- `tests/unit/m10ChallengeIssuance.test.ts`
