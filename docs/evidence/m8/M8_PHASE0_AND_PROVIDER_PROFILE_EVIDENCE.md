# M8 — Provider-neutral Agent Cutover: Phase-0-Preflight und Provider-Profile-Paket Evidence

Status: PHASE 0 COMPLETE, PROVIDER-PROFILE-PAKET **VERIFIED PASS** auf dem realen Test-Pfad, jetzt
zusätzlich real gegen einen echten Aufrufer (SA3/SA4) verdrahtet (siehe Nachtrag Abschnitt 6) — M8
als Ganzes bleibt PLANNED, keine externe Mutation autorisiert, kein Live-Cutover
Datum: 2026-08-15 (Nachtrag: 2026-08-15, selber Tag)
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

## 3. Testlauf (Provider-Profile-Paket, isoliert)

- `npx vitest run` (voller Suite-Lauf): **930 Tests, 161 Dateien, alle PASS** (davon neu: 23 in
  `providerProfile.test.ts`).
- `npm run lint` (`tsc --noEmit`): PASS.

## 6. Nachtrag — Policy Equivalence gegen einen echten Aufrufer verdrahtet (2026-08-15)

Owner-Anweisung (nach Merge des Provider-Profile-Pakets): „Policy Equivalence gegen einen echten
Aufrufer verdrahten". Ziel: das neue, generische `providerProfile.ts` nicht nur isoliert testen,
sondern tatsächlich in einen bestehenden, produktiven Autorisierungspfad einbinden — ohne dessen
bisheriges Verhalten zu verändern.

**Gewählter Aufrufer**: `server/agentAudit/systemadminAuditedExecution.ts` (SA3), der aktive,
Owner-reaktivierte SA3B-GitHub-Actions-Host. Grund: das SA2-Chat-Profil
(`systemadminExecutionProfile.ts`) implementiert bereits händisch exakt ein
ChatGPT-Provider-Profil (`SYSTEMADMIN_CHAT_APP_ID = 'chatgpt-github-connector'`,
`SYSTEMADMIN_CHAT_CAPABILITIES`) — die ideale Stelle, um zu beweisen, dass das neue generische M8-
Registry-Profil zum selben Ergebnis kommt wie die bisherige SA2-spezifische Logik.

**Sicherheitsanalyse vor der Umsetzung**: ein naiver Ansatz — `evaluateProviderScopedAuthorization()`
(die volle Funktion inkl. eigenem `evaluateAgentAuthorization()`-Aufruf) direkt in SA3 einzuhängen —
hätte die bestehende HIGH-Risk-PR-Testabdeckung real gebrochen: SA1
(`evaluateSystemadminRoadmapAuthorization`) baut sein eigenes `AgentApprovalEvidence`-Objekt aus dem
REM-Mandat (`mandate.approvalEvidenceRef`); ein zweiter, unabhängiger
`evaluateAgentAuthorization()`-Aufruf ohne dieselbe Approval-Konstruktion hätte für jede HIGH-Risk-
Anfrage fälschlich verweigert. Daher wurde `providerProfile.ts` refaktoriert: eine neue, reine
`checkProviderProfileScope()`-Funktion führt ausschließlich die Profil-Eingrenzung durch (bekanntes
Profil, appId-Match, Capability-Zugehörigkeit, Audit-Korrelation, Replay) **ohne** `agentIam.ts`
selbst aufzurufen. Die bestehende `evaluateProviderScopedAuthorization()` bleibt für Aufrufer ohne
eigene IAM-Kette unverändert bestehen (jetzt intern auf `checkProviderProfileScope()` aufgebaut,
alle 23 bestehenden Tests weiterhin PASS, reiner Refactor).

**Verdrahtung**: `authorizeSystemadminAuditedExecution()` ruft `checkProviderProfileScope()`
zusätzlich zu (nicht anstelle von) `prepareSystemadminChatAction()` (SA2→SA1→M4) auf. Eine
Verweigerung durch die neue Schicht (`layer: 'PROVIDER_PROFILE'`) gewinnt nur, wenn weder
Self-Authority-Schutz noch die neue Schicht ein ALLOW liefern — die bestehende SA2/SA1/M4-Kette
bleibt in jedem Fall die maßgebliche Autorität für ALLOW-Entscheidungen. `SystemadminChatProfileLayer`
wurde um `'PROVIDER_PROFILE'` erweitert (rein additiv, keine bestehende Verwendung angepasst).

**Regressionsnachweis**: alle 6 bestehenden `systemadminAuditedExecution.test.ts`-Tests bestehen
unverändert. 3 neue Tests bewiesen die Komposition:

1. **Policy-Equivalence-Drift-Guard**: `PROVIDER_PROFILES['chatgpt-github-connector'].allowedCapabilities`
   und `SYSTEMADMIN_CHAT_CAPABILITIES` werden explizit auf exakte Übereinstimmung getestet — driften
   sie künftig auseinander, würde die neue Schicht sofort live gültige SA3B/SA4-Anfragen verweigern,
   und dieser Test schlägt fehl, bevor das passiert.
2. **Audit-Verfügbarkeit**: ein leerer `traceId` führt weiterhin zu einem harten Fehlschlag (bereits
   vorher durch `agentAuditWriter.ts` erzwungen); die neue Schicht stimmt darin unabhängig überein.
3. **Echte Live-Capability (BRANCH, MEDIUM Risk)**: end-to-end-ALLOW durch die komplette Kette
   inklusive der neuen Schicht, identisch zum Verhalten vor dieser Änderung
   (`layer: 'REM_POLICY'`, `executionPermit.auditBoundExecutionPermitted: true`).

**Testlauf (voller Suite-Lauf nach der Verdrahtung)**: `npx vitest run` — **949 Tests, 168 Dateien,
alle PASS**. `npm run lint` (`tsc --noEmit`): PASS.

**Ergebnis**: das M8-Provider-Profile-Registry ist jetzt kein isoliert getestetes Modul mehr, sondern
nimmt real an einer produktiven Autorisierungsentscheidung teil — additiv, ausschließlich
einschränkend, ohne das bestehende SA3B/SA4-Verhalten zu verändern. Dies ist die im Runbook
geforderte „Policy Equivalence" real gegen einen echten Aufrufer bewiesen, nicht nur in Unit-Tests
gegen synthetische Fixtures.

## 4. Was dieses Ergebnis NICHT bedeutet

- M8 als Ganzes ist **nicht** `COMPLETE / VERIFIED PASS`. Bisher deckt dies „Phase 1 — Provider
  Profile Implementation" (für die 4 dokumentierten Provider), eine reale Verdrahtung an genau einen
  bestehenden Aufrufer (SA3/SA3B) und den Rollback-zu-read-only-Nachweis (Abschnitt 7) ab. Offen
  bleiben laut Runbook-Exit-Gate insbesondere: die Cutover-Sequenz für die übrigen Provider (Claude
  Code, Google AI Studio, NotebookLM haben noch keinen echten Aufrufer), direkte Provider-Bypässe
  deaktivieren, und die Frage, wie/ob die Live-interaktive-Sitzungs-Lücke (Abschnitt 1.2) überhaupt
  im Scope von M8 geschlossen werden kann, da sie außerhalb der Repository-Kontrolle liegt.
- Kein bestehender direkter Provider-Zugriffspfad wurde deaktiviert. Der SA3B-Live-Host verhält sich
  für seine tatsächlich genutzte Capability (BRANCH) exakt wie vor dieser Änderung — die neue Schicht
  ist bewiesen ein reiner Zusatz, keine Verhaltensänderung.

## 7. Nachtrag — Rollback-zu-read-only real bewiesen (M8-Exit-Gate-Punkt 6, 2026-08-15)

Owner-Anweisung (nach Merge der SA3B-Verdrahtung): „fahre mit Roadmap fort" → gewähltes nächstes
Element (bei fehlender Präferenz empfohlene Option): Rollback-zu-read-only beweisen, direktes
Gegenstück zu M7s Rollback-Nachweis.

**Befund vor der Umsetzung:** Der einzige bisher an SA3B verdrahtete Kill-Switch
(`mandate.killSwitch.enabled`) verweigert bei Deaktivierung **alles**, inklusive `READ` — zu strikt,
um „restore read-only operation" (M8-Runbook, Rollback-Anforderung 3) tatsächlich zu belegen.
`agentIam.ts`s eigener `killSwitchActive`-Mechanismus verweigert dagegen gezielt nur mutierende
Capabilities und erhält `READ`/`ANALYZE`/`PLAN` — genau das vom Runbook geforderte Verhalten —, war
aber bisher **nicht** durch die SA1-REM-Kette hindurch verdrahtet
(`evaluateSystemadminRoadmapAuthorization`s `iamRequest` enthielt kein `killSwitchActive`-Feld).

**Schließung (additiv, rein einschränkend):**
- `src/platform/Security/roadmapExecutionMandate.ts`: `SystemadminRoadmapAuthorizationRequest`
  erhält ein neues, optionales Feld `killSwitchActive?: boolean` (Standard: nicht gesetzt = keine
  Verhaltensänderung), das unverändert an `evaluateAgentAuthorization()` durchgereicht wird. Fließt
  automatisch durch die gesamte bestehende Kette (Broker → SA3 → SA2 → SA1 → M4), ohne
  `systemadminExecutionProfile.ts` oder `systemadminAuditedExecution.ts` ändern zu müssen.
- `src/platform/Security/providerProfile.ts`: `checkProviderProfileScope()` (und darüber
  `evaluateProviderScopedAuthorization()`) erhält ein optionales `registry`-Parameter — beweist den
  zweiten, unabhängigen Rollback-Hebel „Provider-Profil deaktivieren" (M8-Runbook-Anforderung 1),
  ohne die exportierte `PROVIDER_PROFILES`-Singleton-Registry je zu mutieren.

**Realer Nachweis (nicht nur synthetisch):**
- 2 neue Tests in `tests/unit/roadmapExecutionMandate.test.ts`: `killSwitchActive: true` verweigert
  `BRANCH`/`COMMIT`/`PR`/`CI_REQUEST`, erlaubt `READ`/`ANALYZE`/`PLAN` weiterhin; Normalbetrieb ohne
  das Flag bleibt unverändert.
- 2 neue Tests in `tests/unit/systemadminAuditedExecution.test.ts`, end-to-end durch die **echte,
  live verdrahtete** SA3B-Kette (`authorizeSystemadminAuditedExecution`, nicht nur die isolierte
  REM-Unit-Test-Ebene): die tatsächlich live genutzte Capability `BRANCH` wird bei
  `killSwitchActive: true` verweigert; `READ` bleibt durch dieselbe zurückgerollte Kette erlaubt.
- 3 neue Tests in `tests/unit/providerProfile.test.ts`: eine zurückgerollte Registry-Momentaufnahme
  (chatgpt-github-connector-Profil auf `READ`/`ANALYZE` verengt) verweigert `BRANCH`, erlaubt `READ`;
  die reale exportierte `PROVIDER_PROFILES`-Registry bleibt dabei nachweislich unverändert.

**Testlauf:** `npx vitest run` — **975 Tests, 174 Dateien, alle PASS** (davon neu: 7). Bestehende
SA1/SA2/SA3-Tests (37 vorher) bestehen unverändert — reine additive Erweiterung, kein bestehendes
Verhalten geändert.

**Ergebnis:** M8-Exit-Gate-Punkt 6 („rollback-to-read-only is proven") ist für den bisher einzigen
real verdrahteten Aufrufer (SA3B) real bewiesen, mit zwei unabhängigen, komponierbaren Hebeln
(IAM-Kill-Switch und Provider-Profil-Registry). Für Provider ohne echten Aufrufer (Claude Code,
Google AI Studio, NotebookLM) ist dieser Nachweis mangels Aufrufer nicht anwendbar — bleibt offen,
bis ein echter Aufrufer für sie existiert.

## 5. Geänderte/neue Dateien

**Provider-Profile-Paket:**
- `src/platform/Security/providerProfile.ts` (neu)
- `tests/unit/providerProfile.test.ts` (neu, 23 Tests)

**Nachtrag — Verdrahtung gegen SA3/SA3B:**
- `src/platform/Security/providerProfile.ts` (refaktoriert: neue `checkProviderProfileScope()`,
  `evaluateProviderScopedAuthorization()` baut jetzt darauf auf)
- `src/platform/Security/systemadminExecutionProfile.ts` (Typ `SystemadminChatProfileLayer` um
  `'PROVIDER_PROFILE'` erweitert)
- `server/agentAudit/systemadminAuditedExecution.ts` (neue Komposition mit
  `checkProviderProfileScope()`)
- `tests/unit/systemadminAuditedExecution.test.ts` (3 neue Tests)

**Nachtrag — Rollback-zu-read-only:**
- `src/platform/Security/roadmapExecutionMandate.ts` (neues optionales Feld `killSwitchActive`)
- `src/platform/Security/providerProfile.ts` (neues optionales `registry`-Parameter)
- `tests/unit/roadmapExecutionMandate.test.ts` (2 neue Tests)
- `tests/unit/systemadminAuditedExecution.test.ts` (2 neue Tests)
- `tests/unit/providerProfile.test.ts` (3 neue Tests)

`docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` (diese Datei)
