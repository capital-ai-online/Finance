# DEVELOPMENT Chain Roadmap Block Contract

Status: PROPOSED  
Version: 1.0.0  
Date: 2026-08-12  
Authority: ADR-0070, ESS-0021, ADR-0065, DEVELOPMENT Chain Execution Policy

## Zweck

Dieser Contract beschreibt die **nicht autorisierende Ausführungsprojektion** eines größeren DEVELOPMENT-Chain-Roadmap-Blocks in technisch begrenzte Execution Units (EU) mit jeweils einem verpflichtenden Pull-Request-Checkpoint.

Er ersetzt keine Roadmap, ESS, ADR, REM, IAM-Entscheidung oder Human/Owner-Autorität und führt **keinen eigenen Phase-/Execution-State**.

Kanonische Regel:

```text
Roadmap status = Roadmap source of truth
Execution boundary = Roadmap Block Contract
Authority = Owner-approved REM + IAM + trusted host
Evidence = M5 audit + GitHub PR/CI + traceability
```

## 1. Block identity

Jeder Contract bindet genau einen Roadmap-Block:

- `contractId` — immutable identifier;
- `blockId` — Roadmap block identifier;
- `roadmapPath` — kanonische Roadmap-Datei;
- `roadmapItem` — exakt referenzierter Roadmap-Punkt;
- `roadmapBaselineSha` — Commit, gegen den die Zerlegung geprüft wurde;
- `authorityRefs` — ESS/ADR/Runbook/Policy refs;
- `executionUnits` — geordnete Units;
- `globalStopConditions`;
- `nonDelegableActions`.

Der Contract enthält absichtlich **kein** Feld wie `status`, `complete`, `verifiedPass` oder `currentUnit`. Diese Zustände werden aus Roadmap, GitHub und Evidence abgeleitet.

## 2. Execution Unit Contract

Jede EU MUSS enthalten:

- `unitId`;
- `sequence`;
- `dependsOn`;
- `objective`;
- `authorityRefs`;
- `allowedPaths`;
- `allowedCapabilities`;
- `maxRiskClass`;
- `allowedMutationClasses`;
- `prCheckClass`;
- `requiredPreflight`;
- `implementationRequirements`;
- `requiredTests`;
- `requiredEvidence`;
- `rollback`;
- `prCheckpoint`;
- `resumeGate`.

### 2.1 Allowed paths

`allowedPaths` ist per EU und restriktiver als eine blockweite REM-Allowlist.

Eine mutierende Operation ist nur erlaubt, wenn:

1. Pfad in der EU-Allowlist liegt;
2. Pfad in der REM-Allowlist liegt;
3. Pfad nicht in der Systemadmin-Self-Authority-/Trust-Root-Denylist liegt;
4. kein Open-PR-Overlap vorliegt;
5. Capability/Risk/Mutation Class ebenfalls erlaubt sind.

Der restriktivste Scope gewinnt.

### 2.2 Allowed capabilities

Für repository-only DEVELOPMENT Units sind maximal vorgesehen:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

`MERGE` ist kein erlaubtes Feld und bleibt Human-only.

`PRODUCTION_MUTATION` ist in einem normalen Repository-EU unzulässig. Externe Production Mutations werden durch einen separaten Mutation Handoff + separate Owner Approval behandelt.

### 2.3 Risk ceiling

Jede EU erhält eine eigene Risk Ceiling. Die effektive Risikoklasse ist der strengere Wert aus:

- Capability minimum risk;
- EU risk;
- REM max risk;
- PR check class;
- Security-/Architecture classification.

Eine Überschreitung ergibt `DENY`.

## 3. Dependency model

Eine EU darf nur beginnen, wenn alle `dependsOn`-Units nachweislich ihren PR-Checkpoint abgeschlossen haben.

Für eine vorherige Repository-EU bedeutet dies mindestens:

```text
PR merged
+ merge SHA on current main
+ required CI success
+ work branch deleted
+ trace/evidence references available
```

Ein lediglich geöffneter oder grüner PR erfüllt die Dependency nicht.

## 4. PR checkpoint contract

Jede EU hat standardmäßig:

```json
{
  "required": true,
  "stopAfterPullRequest": true,
  "mergeAuthority": "HUMAN_OWNER_ONLY"
}
```

Nach Erstellung eines review-ready PR stoppt die autonome Sequenz.

Erlaubt vor dem finalen Human Review:

- PR-Body/Evidence synchronisieren;
- Governance-/CI-Fehler analysieren;
- scope-konforme Fixes committen;
- PR aktualisieren;
- targeted checks ausführen.

Nicht erlaubt:

- Merge;
- Scope-Erweiterung außerhalb der EU;
- Start der nächsten EU vor Human Merge + Branch Delete;
- externe Production Mutation.

## 5. Resume gate

Nach Human Merge prüft der Executor read-only:

1. PR state = merged;
2. Merge SHA ist Ancestor von aktuellem `main`;
3. Branch der vorherigen EU ist gelöscht;
4. REM weiterhin gültig/approved;
5. Kill Switch nicht aktiviert;
6. nächste EU im selben REM enthalten;
7. Roadmap Phase weiterhin unblocked;
8. Contract/Roadmap baseline nicht sicherheitsrelevant drifted;
9. keine konkurrierende PR-Überlappung;
10. M5 Audit verfügbar.

Nur dann darf ein frischer Branch für die nächste EU erstellt werden.

## 6. Global STOP conditions

Mindestens:

- `REM_INVALID_OR_EXPIRED`;
- `KILL_SWITCH_ACTIVE`;
- `ROADMAP_GATE_BLOCKED`;
- `ROADMAP_OR_AUTHORITY_DRIFT`;
- `PER_UNIT_SCOPE_MISMATCH`;
- `SELF_AUTHORITY_PATH_REQUESTED`;
- `RESERVED_OWNER_ACTION_REQUIRED`;
- `OPEN_PR_PATH_OVERLAP`;
- `STALE_BASE`;
- `AUDIT_UNAVAILABLE`;
- `CI_BUDGET_EXCEEDED`;
- `REPEATED_FAILURE_WITHOUT_CHANGED_PRECONDITION`;
- `PR_CHECKPOINT_REACHED`;
- `EXTERNAL_MUTATION_APPROVAL_REQUIRED`;
- `ROLLBACK_INCONCLUSIVE`;
- `SECURITY_CRITICAL_AMBIGUITY`.

STOP darf nicht durch Agent-Selbsteinschätzung überschrieben werden.

## 7. Evidence contract

Pro EU werden mindestens referenziert:

- blockId / unitId / mandateId;
- Roadmap baseline SHA;
- Start-main SHA;
- Branch;
- changed paths;
- Preflight Result;
- BRANCH authorization/outcome;
- COMMIT authorization/outcome je mutierender Commit-Operation oder technisch definierter Batch;
- finaler PR Head;
- PR authorization/outcome;
- CI_REQUEST authorization/outcome, wenn Capability verwendet wird;
- targeted test results;
- final CI status;
- Human Review reference;
- Human Merge SHA;
- Branch deletion evidence;
- Rollback state;
- Next-unit resume decision.

Secrets, TOTP-Codes/Secrets, Tokens, Passkey private material und vollständige sensible Payloads sind verboten.

## 8. Block closure

Ein Block ist nicht deshalb abgeschlossen, weil alle Contracts verarbeitet wurden.

Closure ist ausschließlich zulässig, wenn die kanonische Roadmap anhand der tatsächlichen Evidence auf den Exit State aktualisiert wurde und die Traceability Requirement→Implementation→Test→Evidence vollständig ist.

## 9. M5A als erstes geplantes produktives Repository-Beispiel

Nach SA4B VERIFIED PASS kann M5A als erster größerer DEVELOPMENT-Block unter diesem Modell zerlegt werden. Die repository-only Units enden jeweils am PR-Checkpoint. Native Owner MFA Enrollment und sonstige Supabase Production Mutations bleiben danach getrennte Human-approved Mutation Gates des bestehenden M5A Runbooks.

## 10. Technische Aktivierung

Dieser Contract wird erst ausführbar, wenn SA4B:

- sein JSON-Schema implementiert/validiert;
- Contract-Digest und REM/Owner Approval technisch bindet;
- per-EU Pfade/Capabilities/Risk erzwingt;
- einen bounded Code/Test Executor bereitstellt;
- mindestens zwei reale Units mit getrennten PR-/Merge-/Branch-Delete-Checkpoints als VERIFIED PASS nachweist.

Bis dahin ist dieses Dokument Architektur-/Implementierungsauthority, aber keine Runtime-Mutationsfreigabe.
