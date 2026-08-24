# M8 — Owner-genehmigter Handoff als maschinell geprüfte Vorbedingung (Provider-Bindung)

Status: **REPOSITORY-EVIDENCE — Code + Tests, keine Mutation, keine Cutover-Freigabe, keine Owner-Approval**
Datum: 2026-08-24
Baseline: `1d378ce936ca89275ed92e0cc84d8f6b5451e671` (`main`)
Roadmap phase: M8 (Agent Cutover)
Authority: `AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`,
`docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`,
`.ai/contracts/development-chain-mutation-handoff.schema.json`,
`docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` („M8 Provider Equivalence Trace"),
`docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`
Artefakte: `src/platform/Security/ownerApprovedHandoffGate.ts`,
`tests/unit/ownerApprovedHandoffGate.test.ts`

## 0. Zweck und Abgrenzung

`docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` behauptet im Abschnitt „M8 Provider
Equivalence Trace":

> production mutation requires exact approved Handoff plus separately verified execution permission.

Dieses Dokument belegt, dass dieser Satz bis zur hier dokumentierten Arbeit **kein maschinelles Gate
hinter sich hatte**, benennt die zwei konkreten Lücken, und weist nach, dass die Aussage jetzt pro
Provider entscheidbar ist — insbesondere für Claude.

**Dieses Dokument erteilt keine Freigabe.** Es enthält keine Owner-Approval-Evidence, keinen
genehmigten Handoff und keine Cutover-Aktivierung. Es dokumentiert ausschließlich einen
verifizierten Ist-Zustand und ein neues, ausschließlich **verengendes** Gate.

## 1. Befund vor dieser Arbeit

### 1.1 Lücke A — Executor-Identität war frei wählbar

`.ai/contracts/development-chain-mutation-handoff.schema.json` bindet `executorAgentId` als
`const` an einen einzigen Executor. Der TypeScript-Validator
`src/platform/Security/developmentChainMutationHandoff.ts` prüfte dieselbe Eigenschaft dagegen nur
mit `isNonEmptyString`.

Konsequenz: Ein Handoff, der einen beliebigen — auch nie vom Owner gebundenen — Executor benennt,
passierte das TypeScript-Gate, obwohl er den maschinenlesbaren Contract verletzt. Der bestehende
M7-Test benutzt diese Laxheit bereits produktiv (`executorAgentId: 'render-manual-owner-execution'`,
`tests/unit/developmentChainMutationHandoff.test.ts`), weshalb ein bloßes Nachziehen des `const`
den real dokumentierten Owner-Pfad gebrochen hätte.

### 1.2 Lücke B — Provider-Mutation verlangte überhaupt keinen Handoff

`src/platform/Security/providerProfile.ts` gatete mutierende Capabilities ausschließlich über eine
vorhandene Audit-Korrelations-ID und eine Replay-Prüfung. **Nirgends im Repository verlangte Code,
dass vor einer provider-scoped Produktionsmutation ein Handoff existiert.** „exact approved Handoff"
war damit eine Prosa-Anforderung ohne beobachtbaren Kontrollpunkt.

## 2. Umsetzung

`src/platform/Security/ownerApprovedHandoffGate.ts` beantwortet fail-closed genau eine Frage:
*liegt ein exakter, Owner-genehmigter Handoff für diesen Aufrufer, diese Baseline, diese Operation
und dieses Ziel vor?*

Das Modul ist ein **Narrowing-Wrapper**. Es kann ein ALLOW der bestehenden Gates nur in ein DENY
verwandeln, niemals umgekehrt, und erteilt niemandem eine Capability. Prüfreihenfolge:

| Stage | Prüfung |
|---|---|
| `HANDOFF_STRUCTURE` | bestehender Contract-Validator, unverändert wiederverwendet |
| `EXECUTOR_BINDING` | `executorAgentId` muss in `MUTATION_EXECUTOR_BINDINGS` registriert sein — schließt Lücke A, ohne den M7-Owner-Pfad zu brechen |
| `PROVIDER_BINDING` | der handelnde Provider muss exakt der gebundene sein; der Human/Owner-reservierte Pfad ist für jeden Provider gesperrt |
| `PROVIDER_CAPABILITY` | das gebundene Provider-Profil muss die von `mutationClass` implizierte Capability tatsächlich besitzen — schließt Lücke B |
| `BASELINE_DRIFT` | der reale Ausführungs-Commit muss dem gepinnten `baseSha` entsprechen; der Contract nennt Base-Drift invalidierend, kein Code prüfte das bisher |
| `HANDOFF_EXECUTION` | Owner-Identität, Approval-Evidence, Frist, exaktes Ziel, Allowlist, Replay und Audit-Permit — vollständig an das bestehende M7-Gate delegiert, nicht neu implementiert |

### 2.1 Executor-Registry

| `executorAgentId` | Bindung | Herkunft |
|---|---|---|
| `capital-ai-systemadmin-roadmap-executor` | `AGENT` → `chatgpt-github-connector` | SA3B/SA4-GitHub-Actions-Host; appId-Literal laut `M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md` §3.1 |
| `render-manual-owner-execution` | `HUMAN_OWNER` | real durchgeführter M7-Pfad (`docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md`, `M7_ROLLBACK_VERIFICATION_HANDOFF.md`) |

Ein Executor außerhalb dieser Registry kann keinen Handoff tragen. Das Aufnehmen eines Eintrags ist
eine Owner-Entscheidung, keine Agent-Entscheidung.

## 3. Ergebnis pro Provider

| Provider-Profil | Kann ein exakter Owner-genehmigter Handoff existieren? | Stage der Verweigerung |
|---|---|---|
| `claude-code-cli` | **Nein** | `EXECUTOR_BINDING` — kein registrierter Executor zeigt auf dieses Profil |
| `chatgpt-github-connector` | **Nein** | `PROVIDER_CAPABILITY` — das Profil besitzt weder `DEPLOY_REQUEST` noch `PRODUCTION_MUTATION` |
| `grok-xai-connector` | **Nein** | `EXECUTOR_BINDING` — kein registrierter Executor zeigt auf dieses Profil |
| Human/Owner (`render-manual-owner-execution`) | **Ja** | — ALLOW bei exakter Übereinstimmung, wie im M7-Runbook dokumentiert |

**Kein Provider-Profil der Registry besitzt heute `DEPLOY_REQUEST` oder `PRODUCTION_MUTATION`.**
Kein KI-Provider kann daher einen Plattform-Handoff ausführen, unabhängig davon, wie vollständig
dieser genehmigt wäre. Das ist der Code-Ausdruck des bereits dokumentierten Ist-Zustands: die
M7-Render-Mutationen waren Owner-manuelle Handlungen.

### 3.1 Der Claude-Fall im Klartext

Ein **exakter Owner-genehmigter Claude-Handoff kann derzeit nicht vorliegen.** Nicht weil eine
Genehmigung fehlt, die man nachreichen könnte, sondern strukturell: es existiert kein registrierter
Mutation-Executor, der an `claude-code-cli` gebunden ist. Das ist die maschinell prüfbare Fassung
des Befunds aus `docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md` §3/§4
(`claude-code-cli` bleibt `BLOCKED`, und das ist der korrekte Zustand, keine offene Aufgabe).

`tests/unit/ownerApprovedHandoffGate.test.ts` beweist das in drei Verschärfungsstufen:

1. ein Handoff, der Claude als Executor benennt, ist DENY — auch wenn er strukturell valide ist und
   Owner, Approval-Evidence, exaktes Ziel, exakte Operation und gültige Frist enthält;
2. Claude darf den Human/Owner-reservierten M7-Handoff nicht übernehmen;
3. selbst wenn dem Claude-Profil hypothetisch `DEPLOY_REQUEST` erteilt würde, bleibt das Ergebnis
   DENY, solange kein Executor auf das Profil zeigt.

## 4. Nachweis, dass das Gate kein pauschales DENY ist

Ein Gate, das alles verweigert, beweist nichts. `tests/unit/ownerApprovedHandoffGate.test.ts`
enthält daher zwei ALLOW-Fälle:

- der exakte Human/Owner-Handoff des M7-Runbooks wird zugelassen (`executorBinding.kind` =
  `HUMAN_OWNER`);
- mit einer **hypothetisch injizierten** Provider-Registry, die `chatgpt-github-connector` um
  `DEPLOY_REQUEST` erweitert, geht derselbe Agent-Pfad auf. Die Injektion ist testlokal und
  verändert keine reale Autorität; sie zeigt, dass exakt die fehlende Capability blockiert.

Zusätzlich hält ein Drift-Guard fest, dass heute kein Profil der echten Registry diese Capabilities
besitzt. Erhält ein Profil sie künftig, schlägt der Test fehl und erzwingt eine erneute Bewertung
der Cutover-Evidence dieses Providers, statt den Handoff-Pfad still zu öffnen.

## 5. Testergebnis

```text
npx vitest run tests/unit/ownerApprovedHandoffGate.test.ts
  Test Files  1 passed (1)
       Tests  23 passed (23)

npx vitest run
  Test Files  324 passed | 1 skipped (325)
       Tests  1986 passed | 2 skipped (1988)
```

`npx tsc --noEmit` meldet für die berührten Module (`ownerApprovedHandoffGate.ts`,
`providerProfile.ts`, `developmentChainMutationHandoff.ts`) keine Fehler.

## 6. Was diese Arbeit ausdrücklich nicht tut

- Sie erteilt keine Owner-Approval und erzeugt keine Approval-Evidence.
- Sie registriert Claude nicht als Mutation-Executor und ändert kein Provider-Profil.
- Sie ändert keine Cutover-Readiness-Bewertung; `claude-code-cli` bleibt `BLOCKED`.
- Sie verdrahtet kein Live-Execution-Host: es existiert weiterhin kein autonomer
  Plattform-Mutation-Executor. Das Gate ist die Vorbedingung, die ein solcher Host erfüllen müsste.
- Sie ändert `AGENTS.md`, die Traceability-Matrix und die Contract-Schemata nicht.

## Verwandte Dokumente

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`
- `docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md`
- `docs/evidence/m7/M7_REQUIRED_NEGATIVE_TESTS_EVIDENCE.md`
- `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`
