# M10 — Phase 1: Trusted PR State Resolver (2026-08-17)

Status: PHASE 1 IMPLEMENTED AND TESTED — **not** live-wired, **not** a completed M10 phase in the
Exit-Gate sense (Phases 2-6 + Controlled Cutover remain outstanding)
Authority: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` §„Phase 1 — Trusted PR State
Resolver"; ADR-0066 §3, §6; ESS-0022 §2; Threat Model „Canonical Authorization Context", „TOCTOU
Defense"; Owner-Wahl „Phase 1: Trusted PR State Resolver (empfohlen)" via `AskUserQuestion`,
2026-08-17, im Anschluss an die formale M9-Closure (`docs/evidence/m9/M9_CLOSURE_EVIDENCE.md`).

## 0. Zweck und Abgrenzung

Implementiert die erste der sechs M10-Phasen: einen server-seitigen, vertrauenswürdigen Auflöser
des exakten aktuellen Zustands einer CAPITAL-AI Pull Request (Repository, PR-Nummer,
Base-Branch/-SHA, exakter Head-SHA, kanonische sortierte Liste geänderter Dateien, kanonischer
Diff-Review-Digest). Reichweite exakt wie im Runbook §„Phase 1" beschrieben:

- ✅ Auflösungslogik gegen eine injizierte GitHub-API-Abhängigkeit — implementiert und getestet.
- ✅ Eine reale, `fetch()`-basierte GitHub-REST-API-Implementierung der Abhängigkeit —
  implementiert, aber **an keinem Aufrufer verdrahtet**.
- ❌ **Kein** WebAuthn-Challenge (Phase 2), **keine** Assertion-Verifikation (Phase 4), **kein**
  HTTP-Endpunkt, **keine** `server.application.ts`-Verdrahtung — bleiben separate, eigens zu
  autorisierende nächste Schritte, mirror-strukturiert wie bei Break-Glass (Logik-Ebene zuerst,
  dann Live-Verdrahtung als eigener Schritt).
- ❌ M10-Exit-Gate-Punkt 2 („PR-bound WebAuthn Owner assertion is the enforced normal CI
  authorization") gilt **nicht** als erfüllt — das erfordert alle sechs Phasen plus Controlled
  Cutover.
- ❌ ADR-0066 bleibt `PROPOSED`, wird durch dieses Dokument nicht auf `ACCEPTED` gesetzt.

## 1. Implementierung

`server/m10/githubPrStateResolver.ts` (neu):

- `resolveTrustedPrState(request, deps)`: nimmt **ausschließlich** `{ repository, prNumber }`
  entgegen — die Funktionssignatur selbst kann strukturell keinen agentengelieferten Hash/Diff/
  Datei-Set als autoritativ akzeptieren (ADR-0066: „Do not accept agent-supplied hashes as
  authoritative"). Löst Base-Branch/-SHA, Head-SHA und die vollständige (paginierte, bis zu 5000
  Dateien) Liste geänderter Dateien immer frisch über die injizierte `GithubApiFetch`-Abhängigkeit
  auf; akzeptiert nur PRs mit `state === 'open'`.
- Kanonische Werte: `canonicalChangedFileSetHash` = SHA-256 der sortierten Dateinamen-Liste (nur
  Dateinamen — bindet an das Runbook-Feld „canonical sorted changed-file list hash");
  `canonicalDiffReviewDigest` = SHA-256 einer kanonischen Serialisierung von
  `{filename, status, patch}` je Datei in derselben sortierten Reihenfolge (bindet zusätzlich an
  Inhaltsänderungen, nicht nur Dateinamen — Threat-Model-Bedrohung „Diff substitution").
  Binäre/zu-große Diffs ohne `patch`-Feld erhalten einen stabilen Platzhalter statt eines Absturzes
  oder einer stillschweigend fehlenden Bindung.
- `createRealGithubApiFetch(githubToken)`: reale `fetch()`-basierte Implementierung gegen
  `api.github.com` — **keine neue Dependency** (kein Octokit/SDK), bewusst als dünner Wrapper über
  drei REST-Aufrufe, da dieses Repository (M6 Supply-Chain-Provenance) neue Dependencies als
  eigenständige, separat zu begründende Entscheidung behandelt. Nicht verdrahtet — kein Aufrufer im
  Repository konstruiert diese Funktion bisher.

Wiederverwendet unverändert `SYSTEMADMIN_OWNER_ACTOR_ID`/`SYSTEMADMIN_REPOSITORY` aus
`roadmapExecutionMandate.ts` statt neuer Konstanten (Drift-Vermeidung, exakt das in dieser Sitzung
etablierte Wiederverwendungs-Prinzip).

`server/agentAudit/systemadminAuditedExecution.ts`: `server/m10/githubPrStateResolver.ts` zur
bestehenden, eingefrorenen `SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS`-Liste hinzugefügt (schützt die
Datei vor Selbstmodifikation durch einen Agenten über dessen eigene SA3B-mutierte
`requestedPaths` — dasselbe Muster wie zuvor für `breakGlass.ts`/`breakGlassRouter.ts`).

## 2. Fail-Closed-Verhalten (Threat-Model-Abdeckung dieser Phase)

| Bedrohung (Threat Model) | Umgesetzte Gegenmaßnahme |
|---|---|
| Repository außerhalb des Scopes | Sofortige Ablehnung vor jedem GitHub-Aufruf, wenn `repository !== SYSTEMADMIN_REPOSITORY` |
| Agent-gelieferte Hashes als autoritativ | Strukturell unmöglich — die Anfrage-Typdefinition enthält kein Hash-/Diff-/Datei-Set-Feld |
| File-set substitution | Vollständige Datei-Liste immer frisch von GitHub abgefragt, paginiert bis 5000 Dateien, nie truncated |
| Diff substitution | Inhalts-Digest (`canonicalDiffReviewDigest`) ändert sich bei Inhaltsänderung, auch wenn Dateinamen gleich bleiben |
| PR head TOCTOU | Jeder Aufruf löst frisch auf; zwei Aufrufe mit unterschiedlichem Head-SHA erzeugen unterschiedliche Digests (Test bewiesen) |
| GitHub-API-Fehler/Netzwerkausfall | Fail-closed `DENY`, kein stiller Fallback auf einen plausibel wirkenden, aber falschen Zustand |
| Nicht-offene PR (geschlossen/gemerged) | `DENY` — Autorisierung nur für offene PRs sinnvoll |
| Unvollständige Base-/Head-Referenzen | `DENY` statt eines Ergebnisses mit `undefined`-Feldern |

## 3. Testabdeckung

`tests/unit/m10PrStateResolver.test.ts` (neu), 19 Tests:

- Ablehnung außerhalb des Repository-Scopes und bei ungültiger PR-Nummer, jeweils **ohne** jeden
  GitHub-Aufruf (`githubApiFetch` wird nicht aufgerufen).
- Ablehnung bei Non-200-Status, Netzwerkfehler (Exception), nicht-offener PR, unvollständigen
  Base-/Head-Referenzen, Non-Array-Datei-Antwort, Datei-Eintrag ohne gültigen Dateinamen.
- Erfolgreiche Auflösung mit sortierten Dateien (unabhängig von GitHub-Antwortreihenfolge),
  korrektem Owner/Action, gültigen SHA-256-Hex-Hashes.
- **Determinismus:** identischer Input in unterschiedlicher GitHub-Antwortreihenfolge → identischer
  Hash.
- **Diff-Substitution-Abwehr:** gleicher Dateiname, unterschiedlicher Inhalt → gleicher
  File-Set-Hash, unterschiedlicher Diff-Digest.
- **TOCTOU-Abwehr:** unterschiedlicher Head-SHA (neuer Commit) → unterschiedlicher Head-SHA und
  Diff-Digest im Ergebnis.
- Binärdatei ohne `patch`-Feld wird ohne Absturz mit stabilem Platzhalter verarbeitet.
- Paginierung über mehr als eine Seite (101 Dateien, zwei GitHub-API-Seiten).
- Kompilierzeit-Beweis, dass der Anfrage-Typ strukturell kein Hash-/Diff-Feld besitzt.

**Testlauf:** `npx vitest run` — **196 Dateien, 1226 Tests, alle PASS** (davon neu: 19).
`npm run lint` (`tsc --noEmit`) PASS.

## 4. Was dieses Dokument NICHT bedeutet

- M10-Exit-Gate-Punkt 2 gilt **nicht** als erfüllt — nur Phase 1 von 6 plus Controlled Cutover ist
  implementiert.
- Der Resolver ist **nicht live erreichbar** — kein Aufrufer im Produktionscode nutzt ihn bisher,
  weder `createRealGithubApiFetch` noch `resolveTrustedPrState` sind an eine Route gebunden.
- ADR-0066 bleibt `PROPOSED`.
- Es existiert noch kein GitHub-Token/Credential-Provisioning für den Produktionsbetrieb des
  Resolvers — das ist eine Produktionskonfigurations-Frage, die außerhalb eines
  Entwicklungsschritts liegt (CLAUDE.md: keine direkte Mutation von Produktions-Providerkonfiguration
  aus einem Dev-only-Schritt) und beim tatsächlichen Live-Wiring-Schritt zu klären ist.

## 5. Nächste Schritte (jeweils eigene Owner-Freigabe erforderlich)

1. Phase 2 — Challenge Issuance: kryptographisch zufällige, kurzlebige, Einmal-Challenges, an den
   von Phase 1 aufgelösten Kontext gebunden.
2. Phase 4 — Assertion Verification (nach Phase 3, die zwingend Owner-only ist).
3. Phase 5 — Atomic CI Consumption.
4. Phase 6 — Shadow Mode.
5. Live-Wiring dieser Phase-1-Logik hinter einem echten HTTP-Endpunkt, inkl. Produktions-GitHub-
   Token-Provisioning.
6. Controlled Cutover erst nach allen sechs Phasen und vollständiger Negativtest-/Recovery-Evidence.

## Related Documents

- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`
- `server/m10/githubPrStateResolver.ts`
- `tests/unit/m10PrStateResolver.test.ts`
- `docs/evidence/m9/M9_CLOSURE_EVIDENCE.md` (M10-Prerequisite-Gate erfüllt)
