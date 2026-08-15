# M8 — Provider-neutral Agent Cutover: Phase-0-Preflight und Provider-Profile-Paket Evidence

Status: PHASE 0 COMPLETE, PROVIDER-PROFILE-PAKET **VERIFIED PASS** auf dem realen Test-Pfad — M8 als
Ganzes bleibt PLANNED, keine externe Mutation autorisiert, kein Live-Cutover
Datum: 2026-08-15
Roadmap phase: M8
Authority: ADR-0062, `docs/runbooks/M8_AGENT_CUTOVER.md`,
`docs/architecture/ai-agent/AI_AGENT_PROVIDER_PROFILE_CONTRACT.md`, ESS-0019
Executor: direkte Owner-instruierte Claude-Code-Sitzung (dieselbe Vorgehensweise wie M5A–M7)

## 0. Explizit NICHT Teil dieser Sitzung

Diese Sitzung führt **keine** Live-Cutover-Aktion durch. Kein Provider-Profil wird produktiv
verdrahtet, keine bestehende direkte Provider-Zugriffsmethode wird deaktiviert, keine externe
Plattform-Konfiguration wird geändert. Der neue Provider-Profile-Gate
(`src/platform/Security/providerProfile.ts`) ist reiner Repository-Code, an keinen produktiven
Aufrufer angeschlossen.

## 1. Phase 0 — Read-only Inventory (Runbook-Abschnitt „Phase 0")

Ergebnis einer read-only Codebasis-/Dokumenten-Untersuchung:

### 1.1 Bestehende AI-Provider-Integrationen

- **In-Repo-MCP-Konfiguration ist minimal**: `.mcp.json` deklariert ausschließlich `ga4-analytics`
  (read-only Google-Analytics-Zugriff). Kein GitHub-/Supabase-/Stripe-/Render-Schreibzugriff ist im
  Repository selbst konfiguriert.
- **SA3B/SA4-Systemadmin-Execution-Host ist bereits ein funktionierendes, getestetes
  Provider-neutral-artiges Muster — aber nur für einen Provider/Transport** (GitHub Actions OIDC,
  Issue-getriggert): `src/platform/Security/agentIam.ts` (M4) + `roadmapExecutionMandate.ts` (SA1) +
  `server/agentAudit/*` (SA3) + `server/systemadmin/systemadminExecutionBrokerRouter.ts` bilden die
  volle Kette Autorisierung → Audit → Ausführung → Outcome-Audit, real bewiesen für die Capability
  `BRANCH`. Interessant: das SA3B-Workflow-Principal trägt bereits
  `appId: 'chatgpt-github-connector'`, `provider: 'openai'` — die Form, die M8 will, existiert
  bereits für eine ChatGPT-Issue-Trigger-Kombination.
- **ChatGPT/Gemini/Google-AI-Studio/NotebookLM-Referenzen sind fast ausschließlich
  Dokumentation/ADR**, kein echter Ausführungspfad existiert für Gemini/Google-AI-Studio/NotebookLM.
  `docs/runbooks/SYSTEMADMIN_CHAT_EXECUTION_PROFILE.md` benennt selbst (§10) eine strukturelle
  Grenze: "Repository TypeScript cannot intercept or technically wrap every external ChatGPT
  connector call by itself."
- **Produktfeature-LLM-Clients** (`server/anthropicClient.ts`, `server/openaiClient.ts`,
  `src/services/agentModelRouting.ts`) sind reine Inferenz-SDK-Wrapper für Finanzanalyse-Content,
  keine privilegierten Ausführungspfade — explizit außerhalb des M8-Scopes.

### 1.2 Der wichtigste Einzelbefund: diese Live-Sitzung selbst umgeht `agentIam.ts` vollständig

**Bestätigt**: die GitHub-/Render-/Supabase-/Stripe-MCP-Tool-Aufrufe dieser (und jeder) interaktiven
Claude-Code-Sitzung laufen **nicht** durch `evaluateAgentAuthorization()` oder
`evaluateSystemadminRoadmapAuthorization()`. Diese Funktionen sind reine Bibliotheksexporte, die nur
vom serverseitigen Systemadmin-Broker und von Unit-Tests aufgerufen werden. Nichts im Repository
fängt interaktive MCP-Tool-Aufrufe ab. `CLAUDE.md`/`AGENTS.md` wirken nur auf Prosa-Ebene
verhaltenssteuernd, nicht technisch durchsetzend.

**Kritisch für den Scope dieser Sitzung**: der Tool-Grant dieser Sitzung kommt von der äußeren
CCR-/Session-Laufzeitumgebung, **nicht** aus diesem Repository. Es gibt kein In-Repo-Credential oder
keine In-Repo-Konfiguration, die diese Sitzung deaktivieren könnte. „Schließen" dieser Lücke für eine
Live-interaktive-Sitzung ist daher **keine Code-Änderung**, sondern eine Umgebungs-/CCR-Ebenen-Frage
außerhalb dieses Repositories.

### 1.3 Bestehende Testabdeckung (vor dieser Sitzung)

`agentIam.test.ts`, `policyGate.test.ts`, `roadmapExecutionMandate.test.ts`,
`systemadminExecutionHostWorkflow.test.ts`, `systemadminExecutionProfile.test.ts`,
`systemadminAuditedExecution.test.ts`, `systemadminSa4Contracts.test.ts` decken den generischen
IAM-/REM-Kernel und den SA3B/SA4-GitHub-Actions-Pfad vollständig ab. **Es existierte keine einzige
Test-Coverage für ein tatsächliches Provider-Profil-Objekt (ChatGPT/Claude/Google AI Studio) oder
für Cross-Provider-Policy-Equivalence-Vektoren** — genau das schließt Abschnitt 2.

### 1.4 Kill-Switch-Bestand

Zwei unabhängige, bereits getestete Kill-Switch-Mechanismen existieren: `agentIam.ts`'s
`killSwitchActive`-Flag (denied jede mutierende Capability, READ bleibt erhalten) und REM-Level
`killSwitch.enabled` (Mandat ist nur ausführbar, solange scharf geschaltet — Deaktivieren fällt
fail-closed). Kein Kill-Switch existiert für eine Live-interaktive-Sitzung, da nichts sie ohnehin
gate-t (siehe 1.2).

### 1.5 Prerequisite Gate (Runbook-Abschnitt „Prerequisite Gate")

| Punkt | Status |
|---|---|
| 1. M7 `COMPLETE / VERIFIED PASS` | ✅ 2026-08-14, siehe `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` Abschnitt „Exit Gate Closure" |
| 2. Production Deployment Identity verifiziert | ✅ `verify-deployment-identity` CI-Job, real PASS auf mehreren Produktions-Pushes |
| 3. M4 IAM und M5 Audit intakt | ✅ unverändert, weiterhin `VERIFIED PASS` |
| 4. M6 Provenance/Attestation intakt | ✅ unverändert, weiterhin `VERIFIED PASS` |
| 5. Systemadmin-Execution-Host-Pfad hat eigene Evidence | ✅ SA3B/SA4, siehe `systemadminExecutionHostWorkflow.test.ts` etc. |
| 6. Human-only `MERGE` durchgesetzt | ✅ `MERGE` ist keine bekannte Agent-Capability (agentIam.ts), jetzt zusätzlich am Provider-Profile-Layer bestätigt (Abschnitt 2) |

Alle 6 Punkte erfüllt — Phase-1-Implementierung ist zulässig.

## 2. Provider-Profile-Paket (Owner-bestätigter Scope: „Provider Profile Contract + Registry")

- `src/platform/Security/providerProfile.ts` (neu): `PROVIDER_PROFILES`-Registry für alle 4 in
  `AI_AGENT_PROVIDER_PROFILE_CONTRACT.md` dokumentierten Provider (`chatgpt-github-connector`,
  `claude-code-cli`, `google-ai-studio`, `notebooklm`), je mit `plane`, `allowedCapabilities`
  (Teilmenge von `AGENT_CAPABILITIES`), Auth-Quelle, Tool-Transport, Sandbox-Grenze,
  Data-Retention-Hinweis, Kill-Switch-Prozedur. Research-Plane-Profile sind
  Constructor-durchgesetzt auf `READ`/`ANALYZE` begrenzt (ein Versuch, eine mutierende Capability
  einem Research-Profil zuzuweisen, wirft beim Modul-Laden).
- `evaluateProviderScopedAuthorization()`: schränkt `agentIam.ts` nur ein, ersetzt es nie — exakt
  nach dem bereits produktiven Muster von `roadmapExecutionMandate.ts` (SA1). Prüft zusätzlich
  Audit-Korrelations-ID und Envelope-Replay für jede mutierende Capability, bevor überhaupt an
  `evaluateAgentAuthorization()` delegiert wird.
- **Nicht produktiv verdrahtet.** Kein bestehender Aufrufer (Server-Route, Workflow) ruft dieses
  Modul auf — es ist bereit, wird aber von keiner Live-Mutation verwendet.
- `google-ai-studio` und `notebooklm` erhalten bewusst konservative Capability-Sets
  (`[READ, ANALYZE, PLAN]` bzw. `[READ, ANALYZE]`), weil für beide laut Phase-0-Befund kein realer
  Ausführungstransport existiert — eine Erweiterung braucht eine eigene, spätere Scope-Entscheidung.

### 2.1 Policy Equivalence Tests + Negative Tests (Runbook-Abschnitte)

`tests/unit/providerProfile.test.ts` (neu, 23 Tests) deckt jeden im Runbook gelisteten Punkt ab:

**Policy Equivalence Tests**: read-only unter jedem Read-Profil erlaubt; Repository-PR-Arbeit
identisch für ChatGPT und Claude Code unter äquivalentem Scope erlaubt; `MERGE` für jedes Profil
verweigert; Produktionsmutation ohne Approval verweigert; fehlendes/leeres Ziel identisch über
Provider hinweg verweigert; abgelaufene Approval verweigert; Self-Authority-Expansion-artige
Capability verweigert (unbekannt im Capability-Modell, wie `MERGE`); vorgetäuschter
Provider-/Modell-Admin-Status wird ignoriert; Research-Profil-Mutation verweigert; mutierende
Anfrage ohne Audit-Korrelations-ID verweigert.

**Negative Tests**: unbekanntes Provider-Profil verweigert; Principal-appId/Profil-Mismatch
verweigert; unvollständiger Principal bei privilegierter Capability verweigert;
Profil-/Capability-Mismatch verweigert; kein „direkter Admin"-Pfad (leerer appId verweigert);
Research-Profil ruft Mutation-Endpunkt auf → verweigert; Ziel-Mismatch verweigert; wiederholtes
Mutation-Envelope (Replay/Dedupe) verweigert; nicht verfügbares Audit auf Mutationspfad verweigert;
aktiver Kill-Switch verweigert Mutation, behält Lesezugriff.

## 3. Testlauf

- `npx vitest run` (voller Suite-Lauf): **930 Tests, 161 Dateien, alle PASS** (davon neu: 23 in
  `providerProfile.test.ts`).
- `npm run lint` (`tsc --noEmit`): PASS.

## 4. Was dieses Ergebnis NICHT bedeutet

- M8 als Ganzes ist **nicht** `COMPLETE / VERIFIED PASS`. Dieses Paket deckt nur „Phase 1 —
  Provider Profile Implementation" (teilweise, für die 4 dokumentierten Provider) und die dazu
  gehörenden Policy-Equivalence-/Negativtests ab. Offen bleiben laut Runbook-Exit-Gate insbesondere:
  tatsächliche Cutover-Sequenz (direkte Provider-Bypässe deaktivieren), Rollback-zu-read-only real
  bewiesen, Audit-Korrelation über einen echten Aufrufer, und die Frage, wie/ob die
  Live-interaktive-Sitzungs-Lücke (Abschnitt 1.2) überhaupt im Scope von M8 geschlossen werden kann,
  da sie außerhalb der Repository-Kontrolle liegt.
- Kein bestehender direkter Provider-Zugriffspfad wurde deaktiviert oder verändert.

## 5. Geänderte/neue Dateien

- `src/platform/Security/providerProfile.ts` (neu)
- `tests/unit/providerProfile.test.ts` (neu, 23 Tests)
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` (diese Datei)
