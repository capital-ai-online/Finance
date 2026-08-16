# M9 — Kill-Switch Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS (Assurance Domain 6 only; M9 overall remains NOT COMPLETE)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 6, §„Evidence
Schema"; Owner-Autorisierung: explizite Wahl „Kill-Switch-Live-Drill (empfohlen)" via
`AskUserQuestion` in dieser Sitzung, 2026-08-16, im Anschluss an
`docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md` §5.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt **Assurance Domain 6 (Kill Switch)** und trägt zu **M9-Exit-Gate-Punkt 3**
bei. Er ist **nicht** M9-Closure — sieben weitere Exit-Gate-Punkte (u. a. Break-Glass-Drill,
Rollback/Recovery-Drill, Independent Evidence Review) bleiben offen und benötigen jeweils eigene
Owner-Freigabe.

Ausgeführt wurde ausschließlich der bereits real verdrahtete, geprüfte `killSwitchActive`-Hebel
(IAM-Ebene, `agentIam.ts`). Kein Produktionszustand, keine echte GitHub-Mutation, kein
Secret/Credential wurde berührt — der Drill ruft die reale Autorisierungsfunktion
(`authorizeSystemadminAuditedExecution`) mit einer gemockten Supabase-Audit-Senke auf, exakt wie
die bereits gemergte M8-Rollback-Evidence es tat (`docs/evidence/m8/
M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7).

## 1. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-KILLSWITCH-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T02:08:10Z |
| Exakte Baseline | Commit `39a6a6f4029a273b93843b3dc84cc4cd4a093c7b` (main, nach Merge PR #377) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0058 (Agent IAM), ADR-0059/ADR-0065/SA3, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `BRANCH`/`COMMIT`/`PR`/`CI_REQUEST` (MEDIUM) und `READ`/`ANALYZE`/`PLAN` (LOW), Ziel `github:SvenKulessa/Finance` |

## 2. Angriffs-/Testaufbau

Erweitert die real live-wired SA3B-Kette
(`server/agentAudit/systemadminAuditedExecution.ts:authorizeSystemadminAuditedExecution` →
`evaluateSystemadminChatExecutionProfile` → `evaluateSystemadminRoadmapAuthorization` →
`evaluateAgentAuthorization`) um 9 neue Testfälle in
`tests/unit/systemadminAuditedExecution.test.ts`, Describe-Block „M9 Kill-Switch Live-Drill (I2
Assurance, 2026-08-16)":

1. **Alle vier realen mutierenden Capabilities einzeln angegriffen** (`BRANCH`, `COMMIT`, `PR`,
   `CI_REQUEST`), je mit passendem Checkpoint, sodass ausschließlich der Kill-Switch die
   Testvariable ist (nicht ein unabhängiger SA2-Sequenz-Gap). Erwartung: `DENY`, Begründung
   enthält „Kill-Switch", kein `executionPermit`, Audit-Event mit `authorization_decision: 'DENY'`,
   `result: 'DENIED'` wird geschrieben.
2. **Alle drei nicht-mutierenden Capabilities** (`READ`, `ANALYZE`, `PLAN`) unter aktivem Kill-Switch
   angefragt. Erwartung: `ALLOW`, `executionPermit` vorhanden, Audit-Event mit
   `authorization_decision: 'ALLOW'`.
3. **Differenzieller Beweis:** identische `BRANCH`-Anfrage einmal ohne, einmal mit
   `killSwitchActive: true` — beweist, dass die Ablehnung ursächlich am Kill-Switch liegt, nicht an
   einer anderen Bedingung.
4. **Kein Sticky-/Cache-Zustand:** in derselben Session zwei aufeinanderfolgende Anfragen — erst
   mit aktivem, dann mit deaktiviertem Kill-Switch — beweisen, dass jede Anfrage frisch ausgewertet
   wird und keine separate Policy-/Config-Änderung zur Aktivierung/Deaktivierung nötig ist (nur ein
   Boolean-Feld pro Anfrage).

## 3. Erwartetes vs. tatsächliches Ergebnis

| Runbook-Erwartung (Domain 6) | Tatsächliches Ergebnis |
|---|---|
| Neue Agent-Mutationen werden verweigert | ✅ Alle 4 realen mutierenden Capabilities `DENY`, real durch die live-wired Kette |
| Human/Owner- und Operator-Read-Zugriff bleibt erhalten | ✅ `READ`/`ANALYZE`/`PLAN` bleiben `ALLOW` unter identischem aktivem Switch |
| Keine Policy-Schwächung zur Aktivierung/Deaktivierung nötig | ✅ Reines Boolean-Feld pro Anfrage; kein Mandate-/Config-/Code-Change zwischen den beiden Zuständen |
| Aktion wird auditiert | ✅ Jeder DENY- und ALLOW-Fall schreibt ein korreliertes Audit-Event (`mocks.insert` erfasst den realen Payload-Aufruf) |

**Testlauf:** `npx vitest run` — **1086 Tests, 189 Dateien, alle PASS** (davon neu: 9, in
`tests/unit/systemadminAuditedExecution.test.ts`). `npm run lint` (`tsc --noEmit`) PASS.

## 4. Audit-/Outcome-Referenzen

Da die Supabase-Senke in der Testumgebung gemockt ist (wie bei allen bestehenden SA3B-Tests), sind
die Audit-Referenzen synthetische Testwerte (`supabase:agent_audit_events:sa3-auth-1` etc.), keine
echten Produktions-Audit-IDs. Die tatsächlich geschriebenen Payload-Felder (`authorization_decision`,
`result`, `scope.auditCorrelationId`) wurden jedoch gegen die reale, unveränderte
`writeAgentAuditEvent`-Funktion geprüft — dieselbe Funktion, die auch im echten SA3B-Produktionspfad
läuft.

## 5. Seiteneffekt-/Rollback-Zustand

Kein Seiteneffekt: keine echte Branch-/Commit-/PR-/CI-Aktion wurde ausgelöst (die Autorisierungs­
funktion prüft nur die Entscheidung, sie führt keine GitHub-Mutation aus). Kein Rollback
erforderlich — nichts wurde verändert, das zurückgesetzt werden müsste. Der Kill-Switch selbst
wurde nur als Testparameter (`killSwitchActive: true/false`) übergeben, nie an einem echten Agenten
oder Produktionszustand umgeschaltet.

## 6. Residual Findings

Ein bereits in `M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7 dokumentierter, bewusst akzeptierter
Befund bleibt unverändert bestehen und ist **nicht** Gegenstand dieses Drills: der zweite,
unabhängige Kill-Switch (`mandate.killSwitch.enabled = false`, REM-Ebene) verweigert **alles**
inklusive `READ` — strenger als der hier getestete `killSwitchActive`-Hebel. Das ist die dokumentiert
gewollte, striktere Variante („vollständige Abschaltung" statt „Rollback zu read-only") und keine
neue Lücke.

**Keine neuen ungeklärten CRITICAL-Funde.** Kein Owner-Zuordnungsbedarf über die bestehende
SA3/M8-Eigentümerschaft hinaus.

## 7. Bezug zum M9-Exit-Gate

- Punkt 3 „kill-switch drill PASS": **teilweise erfüllt** — dieser Drill deckt den real verdrahteten
  `killSwitchActive`-Hebel für den einzigen produktiven Aufrufer (SA3B) ab. Für `claude-code-cli`/
  `grok-xai-connector` bleibt der Nachweis mangels echtem Aufrufer nicht anwendbar (wie bereits in
  `M8_CLOSURE_EVIDENCE.md` §2 für Rollback/Provider-Profile festgehalten).
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf, bis auch die übrigen
  Exit-Gate-Punkte (1, 2, 4–9) erfüllt sind; dieser Drill allein schließt M9 nicht ab.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7
- `tests/unit/systemadminAuditedExecution.test.ts`
- `server/agentAudit/systemadminAuditedExecution.ts`
- `src/platform/Security/agentIam.ts`
