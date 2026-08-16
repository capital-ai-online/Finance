# M9 — Prompt/Tool-Injection Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS with one documented, unresolved residual finding (Assurance
Domain 2; M9 overall remains NOT COMPLETE)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 2,
§„Evidence Schema"; Owner-Autorisierung: explizite Wahl „Prompt/Tool-Injection-Tests (empfohlen)"
via `AskUserQuestion` in dieser Sitzung, 2026-08-16, im Anschluss an
`docs/evidence/m9/M9_SECRET_EXFILTRATION_LIVE_DRILL_2026-08-16.md`.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt **Assurance Domain 2 (Prompt / Tool Injection)** und trägt zu
**M9-Exit-Gate-Punkt 2** bei — mit einer wichtigen Einschränkung, siehe §1. Er ist **nicht**
M9-Closure.

**Architektureller Befund vor den Tests:** Dieses Repository hat **keinen einzigen Codepfad**, der
Freitext-Inhalte (Issue-/PR-Bodies, Tool-Output, Webseiteninhalte) in Autorisierungsfelder
parst. `capability`, `targetResource`, `roadmapItem` und `requestedPaths` sind immer typisierte
Werte, die per exaktem Abgleich/Allowlist geprüft werden (REM: `mandate.allowedTargets.includes(...)`,
`mandate.roadmapItems.includes(...)`, `isKnownAgentCapability(...)`), nie interpretiert. Dieser
Drill beweist diese Eigenschaft konkret mit tatsächlich adversariell geformten Payloads (nicht nur
generischen Mismatch-Strings), durch die reale, live-wired SA3B-Kette.

## 1. Residual Finding — WICHTIG, nicht in diesem Drill behoben

`SystemadminChatExecutionCheckpoint` besitzt bereits zwei dafür vorgesehene Gate-Felder,
`credentialExposureDetected` und `untrustedScopeElevationDetected`
(`src/platform/Security/systemadminExecutionProfile.ts`), die bei `true` fail-closed verweigern
(`evaluateSystemadminChatExecutionProfile`, bereits isoliert getestet in
`tests/unit/systemadminExecutionProfile.test.ts` „fails closed on credentials, prompt/tool scope
elevation, unexpected production need and final Owner review" — und in diesem Drill zusätzlich
live durch die reale SA3B-Kette bewiesen, siehe §3).

**Der Gate-Mechanismus selbst funktioniert nachweislich.** Aber:

```
scripts/systemadmin/runSa4Pilot.mjs:158:    credentialExposureDetected: false,
scripts/systemadmin/runSa4Pilot.mjs:159:    untrustedScopeElevationDetected: false,
scripts/systemadmin/runWorkPackage.mjs:169:    credentialExposureDetected: false,
scripts/systemadmin/runWorkPackage.mjs:170:    untrustedScopeElevationDetected: false,
```

**Beide real existierenden Aufrufer setzen diese Felder hartkodiert auf `false`.** Es existiert
aktuell **kein realer Content-Scanning-Detektor**, der Issue-/PR-Text, Tool-Output oder externe
Webinhalte tatsächlich auf Injection-Muster prüft und diese Flags entsprechend setzt. Das
Gate-Design ist korrekt und vorbereitet, aber in der Praxis derzeit **inert** — es kann heute nicht
auslösen, weil nichts es jemals auf `true` setzt.

**Warum dieser Fund in diesem Drill nicht behoben wird:** Im Unterschied zu den additiven
Verdrahtungs-Lücken der vorherigen Drills (`killSwitchActive`, Envelope-Replay-Schutz,
Redaction-Muster) — bei denen ein bereits vollständig fertiger Mechanismus nur nicht bis zum realen
Aufrufer durchgereicht wurde — würde die Schließung dieser Lücke den **Neubau eines echten
Content-Scanning-Detektors** bedeuten (Muster-/Heuristik-Design, False-Positive-/Negative-Abwägung,
Performance auf großen Issue-/PR-Bodies). Das ist eine neue Fähigkeit, keine Verdrahtung eines
bestehenden Mechanismus — angemessen für eine eigene, separate Owner-Entscheidung/Spezifikation,
nicht für eine in einem Drill nebenbei eingeführte Heuristik.

**Empfehlung:** eigenes Roadmap-Arbeitspaket „Untrusted-Content-Injection-Detector" vor
M9-Closure, mit explizitem Owner-Scope (welche Inhaltsquellen, welche Erkennungsstrategie,
Fehlerbudget).

## 2. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-PROMPT-INJECTION-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T11:21:47Z |
| Exakte Baseline | Commit `8bbaec4e144e08e613c92cce0fa4a9676dc7764d` (main, nach Merge PR #390) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0058 (Agent IAM), ADR-0065 (REM), ADR-0059/SA3, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `PR`/`BRANCH`/injizierte Strings als Capability, Ziel `github:SvenKulessa/Finance` und injizierte Ziel-Strings |

## 3. Angriffs-/Testaufbau

18 neue Tests in `tests/unit/systemadminAuditedExecution.test.ts`, Describe-Block „M9
Prompt/Tool-Injection Live-Drill (I2 Assurance, 2026-08-16)", gegen die reale
`authorizeSystemadminAuditedExecution()`-Kette. Fünf adversarielle Payloads (Policy-Override-,
Rollen-Hijack-, Mandate-Escape-, SQL-Injection- und Credential-Exfiltrations-geformt) werden
einzeln injiziert in:

1. **`targetResource`** (5 Tests) — jeder Payload wird als Zielressource übergeben.
2. **`execution.roadmapItem`** (5 Tests) — jeder Payload wird als Roadmap-Item übergeben.
3. **`capability`** (5 Tests) — jeder Payload wird als Capability-String übergeben.

Alle 15 erwarten `DENY`, kein `executionPermit` — weil keiner der Payload-Strings in der jeweiligen
typisierten Allowlist (`mandate.allowedTargets`/`mandate.roadmapItems`/`AGENT_CAPABILITIES`)
enthalten ist, exakt wie jeder andere nicht passende String auch.

4. **Metadata-Injektion** (1 Test): ein Payload wird in `context.metadata` (Audit-Logging-Kanal)
   gepflanzt; die resultierende Autorisierungsentscheidung wird gegen einen identischen Aufruf ohne
   den Payload verglichen — beide `ALLOW`, identisch — beweist strukturell, dass Metadaten null
   kausalen Einfluss auf die Entscheidung haben (Metadaten fließen ausschließlich in den
   Audit-Log-Pfad, nie zurück in eine autorisierungsrelevante Prüfung).
5. **Checkpoint-Gate live** (2 Tests): `credentialExposureDetected: true` und
   `untrustedScopeElevationDetected: true` einzeln gegen die reale Kette — `DENY`, auditiert.

## 4. Erwartetes vs. tatsächliches Ergebnis

| Runbook-Erwartung (Domain 2) | Tatsächliches Ergebnis |
|---|---|
| Untrusted content bleibt Daten, nie Autorität | ✅ für alle typisierten Autorisierungsfelder bewiesen (targetResource/roadmapItem/capability/metadata) |
| Instructions to alter policy → kein Effekt | ✅ (kein Codepfad interpretiert Freitext als Policy) |
| Instructions to reveal credentials → kein Effekt | ✅ (Metadata-Test; zusätzlich durch den Secret/Exfiltration-Drill abgedeckt) |
| Instructions to bypass approval/change target/expand capabilities → kein Effekt | ✅ (targetResource-/capability-Injektionstests) |
| Checkpoint-Gate für Credential-/Scope-Elevation-Erkennung funktioniert | ✅ live bewiesen — **aber inert, siehe §1** |

**Testlauf:** `npx vitest run` — **1128 Tests, 189 Dateien, alle PASS** (davon neu: 18, in
`tests/unit/systemadminAuditedExecution.test.ts`). `npm run lint` (`tsc --noEmit`) PASS.

## 5. Seiteneffekt-/Rollback-Zustand

Kein Seiteneffekt: reine Testcode-Ergänzung, keine Produktionscode-Änderung. Kein Rollback
erforderlich.

## 6. Residual Findings (Zusammenfassung)

1. **Kein realer Content-Scanning-Detektor für `credentialExposureDetected`/
   `untrustedScopeElevationDetected`** (§1) — HIGH-Priorität, eigenes Arbeitspaket empfohlen, kein
   Blocker für diesen Drill selbst, aber ein offener Punkt vor M9-Closure.
2. Keine neuen CRITICAL-Funde in den getesteten typisierten Autorisierungsfeldern selbst — die
   exakte Allowlist-Prüfung hält adversarielle Payloads bereits jetzt zuverlässig fern.

## 7. Bezug zum M9-Exit-Gate

- Punkt 2 „all required authorization/injection/replay/exfiltration/audit drills PASS": der
  Injection-Anteil ist **teilweise** erfüllt — die typisierten Autorisierungsfelder sind
  nachweislich immun, aber der vorgesehene Content-Scanning-Detektor existiert nicht real (§1).
  Dieser Punkt sollte vor einer M9-`COMPLETE`-Bewertung explizit vom Owner adressiert werden.
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `tests/unit/systemadminAuditedExecution.test.ts`
- `tests/unit/systemadminExecutionProfile.test.ts`
- `src/platform/Security/systemadminExecutionProfile.ts`
- `scripts/systemadmin/runSa4Pilot.mjs`
- `scripts/systemadmin/runWorkPackage.mjs`
