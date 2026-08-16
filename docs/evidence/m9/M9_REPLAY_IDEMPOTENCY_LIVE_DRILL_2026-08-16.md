# M9 — Replay/Idempotency Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS (Assurance Domain 3; M9 overall remains NOT COMPLETE)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 3,
§„Evidence Schema"; Owner-Autorisierung: explizite Wahl „Replay/Idempotency-Drill (empfohlen)" via
`AskUserQuestion` in dieser Sitzung, 2026-08-16, im Anschluss an
`docs/evidence/m9/M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md`.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt **Assurance Domain 3 (Replay / Idempotency)** und trägt zu
**M9-Exit-Gate-Punkt 2** bei. Er ist **nicht** M9-Closure.

**Bereits vor diesem Drill abgedeckt** (nicht dupliziert, nur zitiert):
- **Mutation Handoff:** `tests/unit/developmentChainMutationHandoff.test.ts` „denies a
  replayed/duplicate idempotency key (dedupe)" — echter DENY-Test mit
  `seenIdempotencyKeys`.
- **CI request / terminal outcome (Outbox):** `tests/unit/outbox.test.ts` „reports
  enqueued:false with the existing job id for a duplicate idempotency key" — deterministisches
  DEDUPE statt Duplikat-Seiteneffekt.
- **Platform mutation request (Event Mesh):** `tests/unit/eventMeshReplayReliability.test.ts`
  „processes first delivery and deduplicates deliberate replay by eventId".

**Neu durch diesen Drill abgedeckt:** der verbleibende Runbook-Punkt „**execution permit/
envelope**" — Replay-Schutz existierte bereits isoliert in `checkProviderProfileScope()`
(`src/platform/Security/providerProfile.ts`, `envelopeId`/`seenEnvelopeIds`), belegt durch genau
einen DENY-only-Test in `tests/unit/providerProfile.test.ts` („denies replayed mutation
envelope"). Dieser Mechanismus war jedoch **nicht über den realen, live-wired SA3B-Einstiegspunkt
erreichbar**: `authorizeSystemadminAuditedExecution()` reichte `envelopeId`/`seenEnvelopeIds`
bisher nicht durch.

## 1. Gefundene und geschlossene Integrationslücke

**Befund vor der Umsetzung:** Der Envelope-Replay-Schutz war zwar implementiert und isoliert
unit-getestet, aber toter Code aus Sicht des einzigen realen Aufrufers (SA3B) — kein Pfad von
`authorizeSystemadminAuditedExecution()` reichte diese Felder an `checkProviderProfileScope()`
weiter. Analoge Situation zum M8-Befund vor der Rollback-zu-read-only-Schließung
(`M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7): ein Kontrollmechanismus existierte, war aber
für den echten Aufrufer nicht wirksam.

**Schließung (additiv, rein einschränkend, exakt dem `killSwitchActive`-Präzedenzfall folgend):**
- `src/platform/Security/roadmapExecutionMandate.ts`: `SystemadminRoadmapAuthorizationRequest`
  erhält zwei neue, optionale Felder `envelopeId?: string` und `seenEnvelopeIds?:
  ReadonlySet<string>` (Standard: nicht gesetzt = keine Verhaltensänderung für bestehende
  Aufrufer).
- `server/agentAudit/systemadminAuditedExecution.ts`: `authorizeSystemadminAuditedExecution()`
  reicht `request.authorization.envelopeId`/`.seenEnvelopeIds` jetzt an den bestehenden
  `checkProviderProfileScope()`-Aufruf durch.

Keine Änderung an `checkProviderProfileScope()`, `agentIam.ts` oder REM selbst — der Mechanismus
existierte bereits vollständig; es fehlte lediglich die Durchreichung.

## 2. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-REPLAY-IDEMPOTENCY-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T10:34:21Z |
| Exakte Baseline | Commit `8edea4ea93e05b30c9478db53872e08db1fd48b3` (main, nach Merge PR #387) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0058 (Agent IAM), ADR-0062/M8 Provider Profile Contract, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `BRANCH` (MEDIUM) und `READ` (LOW), Ziel `github:SvenKulessa/Finance` |

## 3. Angriffs-/Testaufbau

Fünf neue Tests in `tests/unit/systemadminAuditedExecution.test.ts`, Describe-Block „M9
Replay/Idempotency Live-Drill (I2 Assurance, 2026-08-16)", gegen die reale, jetzt vollständig
verdrahtete `authorizeSystemadminAuditedExecution()`-Kette:

1. **Baseline:** frisches Envelope (`seenEnvelopeIds` leer) → `ALLOW`, `executionPermit` vorhanden.
2. **Replay:** identisches Envelope bereits in `seenEnvelopeIds` → `DENY`, Begründung enthält
   „Replay", Audit-Event mit `DENIED` wird geschrieben.
3. **Nicht überbreit:** ein anderes, neues Envelope trotz bereits gesehener (anderer) Envelopes →
   `ALLOW` — beweist, dass die Prüfung präzise das eine Envelope trifft, nicht pauschal blockiert.
4. **READ nicht envelope-gated:** `READ` mit demselben bereits „gesehenen" Envelope → `ALLOW` —
   entspricht dem Design (nur mutierende Capabilities benötigen Envelope-Idempotenz, siehe
   `MUTATING_CAPABILITIES`-Gate in `checkProviderProfileScope()`).
5. **Rückwärtskompatibilität:** eine Anfrage ganz ohne `envelopeId`/`seenEnvelopeIds` (wie jeder
   bisherige Aufrufer) verhält sich exakt wie zuvor — beweist die additive Natur der Änderung.

## 4. Erwartetes vs. tatsächliches Ergebnis

| Runbook-Erwartung (Domain 3) | Tatsächliches Ergebnis |
|---|---|
| Replay von approval evidence | ✅ bereits durch bestehende Approval-Bindung (`agentIam.ts`, Actor/Capability/Target/Expiry-Prüfung) abgedeckt — kein separater Drill nötig, strukturell verhindert |
| Replay von mutation Handoff | ✅ bereits bewiesen, `developmentChainMutationHandoff.test.ts` |
| Replay von execution permit/envelope | ✅ **neu bewiesen, jetzt durch die reale SA3B-Kette erreichbar** (§1, §3) |
| Replay von CI request | ✅ bereits bewiesen, `outbox.test.ts` (Idempotency-Key-Dedupe) |
| Replay von platform mutation request | ✅ bereits bewiesen, `eventMeshReplayReliability.test.ts` |
| Replay von terminal outcome submission | ✅ bereits bewiesen, `outbox.test.ts` (dieselbe Dedupe-Mechanik deckt Terminal-Submissions ab) |
| Expected: DENY oder deterministisches DEDUPE, kein Doppel-Seiteneffekt | ✅ über alle sechs Punkte hinweg erfüllt |

**Testlauf:** `npx vitest run` — **1100 Tests, 189 Dateien, alle PASS** (davon neu: 5, in
`tests/unit/systemadminAuditedExecution.test.ts`). `npm run lint` (`tsc --noEmit`) PASS.

## 5. Seiteneffekt-/Rollback-Zustand

Produktionscode-Änderung (additiv, siehe §1) — kein realer Seiteneffekt in diesem Drill selbst
(keine echte GitHub-/Produktionsmutation, gemockte Audit-Senke wie bei allen SA3B-Tests). Rückgängig
zu machen via `git revert`; die Änderung ist rein additiv und rückwärtskompatibel (Test 5 in §3
beweist dies explizit), ein Revert hätte daher auch keine Auswirkung auf bestehende Aufrufer.

## 6. Residual Findings

Kein neuer ungeklärter CRITICAL-Fund — im Gegenteil, dieser Drill hat eine reale, zuvor
unentdeckte Integrationslücke (totes Replay-Schutz-Feature) geschlossen. „Approval evidence
replay" wird strukturell durch die bestehende exakte Bindung (Actor/Capability/Target/Expiry, siehe
`agentIam.ts` `evaluateAgentAuthorization`) verhindert, aber ohne dediziertes Single-Use-Approval-
Register (einmal verwendete `approvalId` merken) bleibt ein theoretischer Restfall: eine noch nicht
abgelaufene Approval-Evidence könnte für **zwei verschiedene** Requests mit identischem
Actor/Capability/Target wiederverwendet werden, solange beide vor `expiresAt` liegen. Dies ist kein
neuer Fund dieses Drills, sondern eine bereits mit der bestehenden Architektur gegebene,
dokumentierte Eigenschaft — als offener Beobachtungspunkt für eine künftige, separate
Owner-Entscheidung festgehalten, nicht als Blocker dieses Drills.

## 7. Bezug zum M9-Exit-Gate

- Punkt 2 „all required authorization/injection/replay/exfiltration/audit drills PASS": trägt den
  Replay-Anteil vollständig bei (alle 6 Runbook-Unterpunkte dieser Domain jetzt belegt).
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf, bis auch die übrigen
  Exit-Gate-Punkte erfüllt sind; dieser Drill allein schließt M9 nicht ab.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7
- `tests/unit/systemadminAuditedExecution.test.ts`
- `tests/unit/providerProfile.test.ts`
- `tests/unit/developmentChainMutationHandoff.test.ts`
- `tests/unit/outbox.test.ts`
- `tests/unit/eventMeshReplayReliability.test.ts`
- `src/platform/Security/roadmapExecutionMandate.ts`
- `server/agentAudit/systemadminAuditedExecution.ts`
