# M9 — Authorization-Bypass Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS (Assurance Domain 1; M9 overall remains NOT COMPLETE)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 1,
§„Evidence Schema"; Owner-Autorisierung: explizite Wahl „Authorization-Bypass-Negativtests
(empfohlen)" via `AskUserQuestion` in dieser Sitzung, 2026-08-16, im Anschluss an
`docs/evidence/m9/M9_REPLAY_IDEMPOTENCY_LIVE_DRILL_2026-08-16.md`.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt **Assurance Domain 1 (Authorization Bypass)** und trägt zu
**M9-Exit-Gate-Punkt 2** bei. Er ist **nicht** M9-Closure.

**Ausgangslage:** Alle 9 im Runbook geforderten Angriffsvektoren hatten bereits isolierte
Unit-Testabdeckung auf der REM-Ebene (`tests/unit/roadmapExecutionMandate.test.ts`:
„denies missing, draft, revoked and expired mandate authority", „binds authority to exact Owner,
Systemadmin principal, repository and roadmap item", „denies unknown or non-granted
capabilities", „denies risk above the mandate maximum", „enforces exact target and path
allowlists", „prevents the Systemadmin agent from modifying its own trust-root paths", „denies
every reserved Human/Owner mutation class"). Das entspricht exakt dem Muster, das jeder frühere
Drill dieser Sitzung bereits vorfand: der Kontrollmechanismus existiert und ist isoliert bewiesen,
aber nicht durchgängig über den **realen, live-wired, auditierten SA3B-Einstiegspunkt**
(`authorizeSystemadminAuditedExecution`) verifiziert.

**Bereits vor diesem Drill über die reale Kette bewiesen** (nicht dupliziert, nur zitiert):
- **Human-reserved action** (`MERGE`): `tests/unit/systemadminAuditedExecution.test.ts` „keeps
  MERGE and production capabilities outside the audited permit path".
- **Self-Authority mutation:** dieselbe Datei, „denies and audits attempts to rewrite the SA2/SA3
  control plane".
- **Direct tool/connector bypass:** dieselbe Datei, die „M8 Provider Profile Registry
  composition"-Tests (unabhängige Defense-in-depth-Schicht neben REM/IAM).

**Neu durch diesen Drill abgedeckt** (die verbleibenden 6 Angriffsvektoren, jetzt über die reale
Kette statt nur isoliert):
1. Missing principal
2. Wrong principal/provider profile
3. Missing/unknown capability
4. Risk above allowed ceiling
5. Wrong target/resource
6. Expired/revoked mandate (als zwei getrennte Fälle: `status !== OWNER_APPROVED` und
   `now >= expiresAt`)

## 1. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-AUTHZ-BYPASS-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T10:46:43Z |
| Exakte Baseline | Commit `e285cabff03800d7feadddc3f0627e093b509255` (main, nach Merge PR #388) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0058 (Agent IAM), ADR-0065 (REM), ADR-0059/SA3, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `BRANCH`/`PR`/unbekannt, verschiedene Risikoklassen, Ziel `github:SvenKulessa/Finance` (und absichtlich falsche Ziele) |

## 2. Angriffs-/Testaufbau

Sieben neue Tests in `tests/unit/systemadminAuditedExecution.test.ts`, Describe-Block „M9
Authorization-Bypass Live-Drill (I2 Assurance, 2026-08-16)", jeweils gegen die reale
`authorizeSystemadminAuditedExecution()`-Kette, mit einer gemeinsamen Prüf-Helper-Funktion
(`expectDeniedAndAudited`), die für jeden Fall verifiziert: `DENY`, kein `executionPermit`, und ein
auditiertes `DENIED`-Ereignis wird geschrieben.

1. **Missing principal:** `humanActorId: ''` → `DENY`.
2. **Wrong principal:** `agentId` weicht vom Systemadmin-Subjekt ab → `DENY` explizit auf der
   `CHAT_PROFILE`-Schicht (SA2), bevor REM/IAM überhaupt erreicht wird.
3. **Unknown capability:** `'DESTROY_EVERYTHING'` (kein Element von `AGENT_CAPABILITIES`) → `DENY`.
4. **Risk above ceiling:** `BRANCH` (MEDIUM) unter einem auf `LOW` gedeckelten Mandat → `DENY`.
5. **Wrong target:** `targetResource: 'github:someone-else/unrelated-repo'`, außerhalb
   `mandate.allowedTargets` → `DENY`.
6. **Revoked/unapproved mandate:** `mandate.status: 'DRAFT'` statt `'OWNER_APPROVED'` → `DENY`.
7. **Expired mandate:** `execution.now` nach `mandate.expiresAt` → `DENY`.

## 3. Erwartetes vs. tatsächliches Ergebnis

| Runbook-Erwartung (Domain 1) | Tatsächliches Ergebnis |
|---|---|
| Missing principal → DENY | ✅ |
| Wrong principal/provider profile → DENY | ✅ (auf SA2-`CHAT_PROFILE`-Schicht, vor REM/IAM) |
| Missing/unknown capability → DENY | ✅ |
| Risk above allowed ceiling → DENY | ✅ |
| Wrong target/resource → DENY | ✅ |
| Expired/revoked mandate/approval → DENY | ✅ (beide Unterfälle einzeln bewiesen) |
| Human-reserved action → DENY | ✅ bereits live bewiesen (zitiert, §0) |
| Self-Authority mutation → DENY | ✅ bereits live bewiesen (zitiert, §0) |
| Direct tool/connector bypass → DENY | ✅ bereits live bewiesen (zitiert, §0) |
| Kein Seiteneffekt, auditierbares Ergebnis | ✅ über alle 9 Vektoren hinweg — kein Fall gab ein `executionPermit` zurück, jeder DENY wurde mit `result: 'DENIED'` auditiert |

**Testlauf:** `npx vitest run` — **1107 Tests, 189 Dateien, alle PASS** (davon neu: 7, in
`tests/unit/systemadminAuditedExecution.test.ts`). `npm run lint` (`tsc --noEmit`) PASS.

## 4. Seiteneffekt-/Rollback-Zustand

Kein Seiteneffekt: reine Testcode-Ergänzung, keine Produktionscode-Änderung (im Unterschied zum
vorherigen Replay/Idempotency-Drill). Kein Rollback erforderlich.

## 5. Residual Findings

Kein neuer ungeklärter CRITICAL-Fund — im Gegenteil, dieser Drill bestätigt, dass alle 9
Runbook-Angriffsvektoren bereits vor diesem Drill strukturell verweigert wurden; er schließt nur
die Lücke zwischen isolierter REM-Testabdeckung und dem beweisbaren Verhalten am realen
Einstiegspunkt.

## 6. Bezug zum M9-Exit-Gate

- Punkt 2 „all required authorization/injection/replay/exfiltration/audit drills PASS": trägt den
  Authorization-Bypass-Anteil vollständig bei (alle 9 Runbook-Vektoren jetzt über die reale Kette
  belegt).
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf, bis auch die übrigen
  Exit-Gate-Punkte erfüllt sind; dieser Drill allein schließt M9 nicht ab.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `tests/unit/systemadminAuditedExecution.test.ts`
- `tests/unit/roadmapExecutionMandate.test.ts`
- `src/platform/Security/roadmapExecutionMandate.ts`
- `src/platform/Security/systemadminExecutionProfile.ts`
- `server/agentAudit/systemadminAuditedExecution.ts`
