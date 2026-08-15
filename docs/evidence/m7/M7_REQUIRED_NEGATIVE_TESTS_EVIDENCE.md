# M7 — Deployment Identity: Required Negative Tests Evidence

Status: alle 10 im Runbook gelisteten Required Negative Tests sind real, automatisiert und
reproduzierbar **VERIFIED PASS** — M7-Exit-Gate-Punkt 6 ist damit geschlossen
Datum: 2026-08-14
Roadmap phase: M7
Authority: ADR-0061, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` Abschnitt „Required Negative
Tests", `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`,
`.ai/contracts/development-chain-mutation-handoff.schema.json`
Executor: direkte Owner-instruierte Claude-Code-Sitzung (Owner-Anweisung „fang mit der Required
Negative Tests Liste an")

## 0. Ausgangslage

`docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` listet 10 Required Negative Tests als
Voraussetzung für den M7-Exit-Gate-Punkt 6. Vor dieser Sitzung existierte dafür kein Code: die
DEVELOPMENT Chain Mutation Handoff Contract (`.ai/contracts/development-chain-mutation-handoff.schema.json`)
ist ein reines Dokumentationsartefakt ohne Validator, und `executorAgentId` ist fest auf den
SA3B/GitHub-Roadmap-Executor gebunden — dieses Schema war für einen hypothetischen, für Render nie
gebauten automatisierten Executor gedacht, nicht für die tatsächlich genutzte Owner-manuelle
Mutationsausführung (Deploy-Hook-Rotation, Rollback, Roll-Forward — alle drei real durchgeführt und
verifiziert, siehe `docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md` und
`docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md`).

Diese Sitzung schließt diese Lücke, indem sie für jeden der 10 Punkte einen konkreten, automatisiert
laufenden Test schreibt, der beweist, dass das jeweilige DENY-Verhalten tatsächlich eintritt — nicht
nur, dass es dokumentiert ist.

## 1. Neue Implementierung

- `src/platform/Security/developmentChainMutationHandoff.ts` (neu): strukturvalidierender
  `validateMutationHandoff()` (spiegelt die JSON-Schema-Regeln plus eine neue, strengere Regel: bei
  `platform: RENDER` muss `targetResource` exakt dem bekannten Finance-Service
  `srv-d91o1o9o3t8c73edi55g` entsprechen) sowie ein Ausführungszeit-Gate
  `evaluateMutationHandoffExecution()`, das zusätzlich Akteur-, Ziel-, Ablauf-, Replay- und
  Audit-Permit-Prüfungen durchführt. Folgt exakt dem bereits bestehenden Muster von
  `src/platform/Security/roadmapExecutionMandate.ts` (`validateRoadmapExecutionMandate` /
  `evaluateSystemadminRoadmapAuthorization`), das für den SA3B/SA4-Pfad bereits produktiv ist.
- **Wichtig, ehrlich benannt:** Dieses Gate ist **nicht** an einen echten Render-Executor
  angeschlossen — keiner existiert. Es beweist, dass die DENY-Logik korrekt ist und einsatzbereit
  wäre, falls jemals ein automatisierter Render-Executor gebaut wird. Alle drei bisherigen echten
  M7-Render-Mutationen blieben Owner-manuell und wurden ausschließlich nachträglich über Renders
  eigene API verifiziert (siehe die beiden oben verlinkten Handoff-Dokumente) — das bleibt das
  akzeptierte Betriebsmodell für M7, dieses Gate ändert daran nichts.
- `tests/unit/ciDeploymentGuards.test.ts` (neu): statische Assertions gegen
  `.github/workflows/ci.yml`, dass `deploy-production`, `supply-chain-attestation` und
  `verify-deployment-identity` ausschließlich bei `push` auf `refs/heads/main` laufen und niemals
  `pull_request`/`workflow_dispatch` erwähnen.
- `tests/integration/verifyDeploymentIdentityCli.test.ts` (neu): startet
  `scripts/deployment/verifyDeploymentIdentity.ts` als echten Subprozess gegen einen lokalen
  Mock-Health-Server, der entweder einen falschen Commit oder HTTP 503 liefert, mit sehr kurzem
  Poll-/Timeout-Intervall, und beweist Exit-Code ≠ 0 plus `result: "FAILED / TIMEOUT"` im
  Evidence-Artefakt.

## 2. Mapping — jeder Punkt der Required-Negative-Tests-Liste

| # | Runbook-Punkt | Nachweis | Ergebnis |
|---|---|---|---|
| 1 | deploy request from non-`main` or unverified source → DENY | `developmentChainMutationHandoff.test.ts`: „rejects a non-main baseBranch"; `ciDeploymentGuards.test.ts`: alle drei Deploy-Jobs tragen `github.event_name == 'push' && github.ref == 'refs/heads/main'` und erwähnen nirgends `pull_request` | **PASS** |
| 2 | source/provenance/artifact mismatch → DENY | `developmentChainMutationHandoff.test.ts`: „rejects an invalid baseSha"; ergänzend bereits bestehend: `verifyDeploymentIdentity.test.ts` (Commit-Mismatch, Repo-Mismatch) und `scripts/security/verifySupplyChainProvenance.ts` (M6, cosign-Signaturprüfung) | **PASS** |
| 3 | wrong Render service/environment → DENY | `developmentChainMutationHandoff.test.ts`: „rejects a Render targetResource that is not the known Finance service" — neue Regel pinnt `targetResource` bei `platform: RENDER` hart auf `srv-d91o1o9o3t8c73edi55g` | **PASS** |
| 4 | expired/missing Owner mutation approval → DENY | `developmentChainMutationHandoff.test.ts`: „requires approvalEvidenceRef..." (fehlend) und „denies execution once the Handoff/approval has expired" (`expiresAt` in der Vergangenheit) | **PASS** |
| 5 | Handoff target mismatch → DENY | `developmentChainMutationHandoff.test.ts`: „denies when the attempted target does not match the Handoff target" | **PASS** |
| 6 | duplicate/replayed mutation request → DENY/DEDUPE | `developmentChainMutationHandoff.test.ts`: „denies a replayed/duplicate idempotency key" (`seenIdempotencyKeys`); ergänzend bereits bestehend für den SA3B-Pfad: `roadmapExecutionMandate.ts`'s `unchangedHeadAlreadyValidated`-Dedupe, getestet in `roadmapExecutionMandate.test.ts` | **PASS** |
| 7 | execution without durable audit permit → DENY | `developmentChainMutationHandoff.test.ts`: „denies execution without a durable audit permit reference"; ergänzend bereits bestehend für den SA3B-Pfad: `systemadminExecutionHostWorkflow.test.ts`'s „places durable authorization before the sole branch side effect" | **PASS** |
| 8 | agent attempts `MERGE` → DENY | `developmentChainMutationHandoff.test.ts`: „denies an attempted MERGE operation" und „rejects allowedOperations that contain MERGE"; bereits bestehend generisch für jede Agent-Capability: `agentIam.test.ts`'s „never exposes MERGE as an agent capability" und `policyGate.test.ts`'s „keeps MERGE outside the agent runtime policy surface" | **PASS** |
| 9 | arbitrary platform operation outside Handoff → DENY | `developmentChainMutationHandoff.test.ts`: „denies an arbitrary operation outside the Handoff allowlist" und „denies an operation explicitly listed in forbiddenOperations beyond the always-forbidden set" | **PASS** |
| 10 | health/readiness failure → rollback/STOP | `verifyDeploymentIdentityCli.test.ts`: echter Subprozesslauf gegen falschen Commit und gegen HTTP 503 — beide enden mit Exit-Code ≠ 0 und `FAILED / TIMEOUT`-Evidence; real bereits einmal in Produktion beobachtet (siehe `M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md` Abschnitt 0.1: der erste echte `push`-Lauf schlug 5 Minuten lang korrekt fail-closed fehl, bevor der Root-Cause-Fix griff) | **PASS** |

## 3. Testlauf

- `npx vitest run` (voller Suite-Lauf, nicht nur neue Dateien): **901 Tests, 158 Dateien, alle PASS**
  (davon neu: 20 in `developmentChainMutationHandoff.test.ts`, 5 in `ciDeploymentGuards.test.ts`, 2
  in `verifyDeploymentIdentityCli.test.ts`).
- `npm run lint` (`tsc --noEmit`): PASS.
- `node --test scripts/pr/*.test.mjs`: 1 vorbestehender, von dieser Änderung unabhängiger Fehler in
  `runtimeArtifactImmutability.test.mjs` (Fixture vergleicht gegen einen festen Platzhalter-Commit,
  nicht gegen den aktuellen `main`-HEAD, der sich durch parallele Agenten-PRs seither weiterbewegt
  hat) — reproduziert identisch mit und ohne diese Änderung, außerhalb des Scopes dieser Aufgabe,
  nicht angefasst.

## 4. Was dieses Ergebnis NICHT bedeutet

- Es gibt weiterhin **keinen** automatisierten Render-Execution-Host. Alle drei bisherigen
  M7-Render-Mutationen bleiben Owner-manuell durchgeführt und nachträglich verifiziert. Das neue
  Gate (`evaluateMutationHandoffExecution`) ist bereit, falls ein solcher Host jemals gebaut wird,
  ersetzt aber nicht die bestehende Owner-Handoff-Verifikations-Praxis.
- M7 als Ganzes ist mit diesem Punkt **nicht automatisch** `COMPLETE / VERIFIED PASS` — siehe die
  vollständige Exit-Gate-Neubewertung in den Roadmap-/Traceability-Dokumenten für den Status aller 9
  Punkte.

## 5. Geänderte/neue Dateien

- `src/platform/Security/developmentChainMutationHandoff.ts` (neu)
- `tests/unit/developmentChainMutationHandoff.test.ts` (neu, 20 Tests)
- `tests/unit/ciDeploymentGuards.test.ts` (neu, 5 Tests)
- `tests/integration/verifyDeploymentIdentityCli.test.ts` (neu, 2 Tests)
- `docs/evidence/m7/M7_REQUIRED_NEGATIVE_TESTS_EVIDENCE.md` (diese Datei)
